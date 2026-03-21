import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { sendNotificationEmail, getUserEmail } from "@/lib/email";
import { verifyMercadoPagoWebhookSecurity } from "@/lib/webhook-security";
import { validateMercadoPagoRuntimeConfig } from "@/lib/mercadopago-runtime";

type WebhookPayload = {
  action?: string;
  type?: string;
  topic?: string;
  data?: { id?: string | number };
  resource?: string | number;
  live_mode?: boolean;
};

function resolveMercadoPagoTimeout(): number {
  const raw = process.env.MP_API_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed < 1000) {
    return 10000;
  }

  return Math.floor(parsed);
}

function resolveWebhookFetchAttempts(): number {
  const raw = process.env.MP_WEBHOOK_FETCH_ATTEMPTS?.trim();
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 2;
  }

  return Math.min(Math.floor(parsed), 4);
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getPaymentWithRetry(params: {
  paymentClient: Payment;
  paymentId: string | number;
}) {
  const attempts = resolveWebhookFetchAttempts();
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await params.paymentClient.get({ id: params.paymentId });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }

      // Exponential backoff corto para errores transitorios de red/API.
      const backoffMs = 250 * Math.pow(2, attempt - 1);
      await delay(backoffMs);
    }
  }

  throw lastError;
}

function getCorrelationId(request: NextRequest): string {
  return (
    request.headers.get("x-request-id")?.trim() ||
    request.headers.get("x-correlation-id")?.trim() ||
    crypto.randomUUID()
  );
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const webhookSecret =
      process.env.MP_WEBHOOK_SECRET?.trim() ||
      process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
    const runtimeValidation = validateMercadoPagoRuntimeConfig({
      accessToken,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      webhookSecret,
      requireWebhookSecretInProduction: true,
    });

    if (!runtimeValidation.valid) {
      return NextResponse.json({ error: runtimeValidation.error, requestId: correlationId }, { status: 500 });
    }
    const resolvedAccessToken = accessToken as string;

    // Get notification data from MercadoPago
    const body = (await request.json()) as WebhookPayload;
    console.log("MercadoPago webhook received", {
      correlationId,
      type: body.type,
      topic: body.topic,
      action: body.action,
      dataId: body.data?.id ?? body.resource,
      liveMode: body.live_mode,
    });

    // Mercado Pago "Test notification" from dashboard uses a synthetic payment id.
    // We acknowledge it early to avoid failing the URL check with a 500.
    if (
      body.live_mode === false &&
      String(body.data?.id ?? body.resource ?? "") === "123456"
    ) {
      return NextResponse.json({ success: true, simulated: true, requestId: correlationId }, { status: 200 });
    }

    if (webhookSecret) {
      const securityCheck = verifyMercadoPagoWebhookSecurity({
        signatureHeader: request.headers.get("x-signature"),
        requestIdHeader: request.headers.get("x-request-id"),
        dataId: body.data?.id ?? body.resource,
        secret: webhookSecret,
      });

      if (!securityCheck.valid) {
        console.error("MercadoPago webhook rejected", { correlationId, reason: securityCheck.reason });
        return NextResponse.json({ error: "INVALID SIGNATURE", requestId: correlationId }, { status: 401 });
      }
    }

    // MercadoPago sends notifications in different formats
    // Format 1 (old): { resource: "123", topic: "payment" }
    // Format 2 (new): { type: "payment", data: { id: "123" }, action: "payment.created" }
    
    const { type, topic, data, resource } = body;
    const notificationType = type || topic;
    
    // We only process payment notifications
    if (notificationType !== "payment") {
      console.log("Ignoring non-payment notification", { correlationId, notificationType });
      return NextResponse.json({ success: true, requestId: correlationId }, { status: 200 });
    }

    // Get payment ID from either format
    const paymentId = data?.id || resource;
    
    if (!paymentId) {
      console.error("No payment ID in webhook data");
      return NextResponse.json({ error: "No payment ID", requestId: correlationId }, { status: 400 });
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken: resolvedAccessToken,
      options: {
          timeout: resolveMercadoPagoTimeout(),
      }
    });

    const payment = new Payment(client);

    // Get payment details from MercadoPago API
    const paymentData = await getPaymentWithRetry({
      paymentClient: payment,
      paymentId,
    });
    console.log("Payment data from MercadoPago", {
      correlationId,
      paymentId: paymentData.id,
      paymentStatus: paymentData.status,
      externalReference: paymentData.external_reference,
    });

    if (!paymentData.external_reference) {
      console.error("No external_reference (order_id) in payment");
      return NextResponse.json({ error: "No order reference", requestId: correlationId }, { status: 400 });
    }

    const orderId = paymentData.external_reference;
    const paymentStatus = paymentData.status;
    const paymentIdString = paymentData.id?.toString();
    const merchantOrderId = paymentData.order?.id?.toString();

    // Create Supabase service client (bypasses RLS for webhook operations)
    const supabase = createServiceClient();

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return NextResponse.json({ error: "Order not found", requestId: correlationId }, { status: 404 });
    }

    // Update order based on payment status
    const updateData: {
      mercadopago_payment_id: string | null;
      mercadopago_merchant_order_id: string | null;
      payment_status?: "paid" | "failed";
      status?: "confirmed";
    } = {
      mercadopago_payment_id: paymentIdString ?? null,
      mercadopago_merchant_order_id: merchantOrderId ?? null,
    };

    if (paymentStatus === "approved") {
      // Payment approved - update to paid and confirmed
      updateData.payment_status = "paid";
      updateData.status = "confirmed";

      console.log("Payment approved, updating order:", orderId);

      // Update order only if it is still pending payment.
      // This makes stock decrement idempotent when MercadoPago sends duplicate notifications.
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .eq("payment_status", "pending_payment")
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order", requestId: correlationId }, { status: 500 });
      }

      if (!updatedOrder) {
        console.log("Payment notification already processed, skipping stock decrement:", orderId);
        return NextResponse.json({ success: true, duplicate: true, requestId: correlationId }, { status: 200 });
      }

      // Decrement stock for each item (only if not already decremented)
      for (const item of order.order_items) {
        const sizeLabel = item.size && item.size !== 'ÚNICO' ? item.size : null;
        const { error: stockError } = await supabase.rpc("decrement_stock", {
          product_id: item.product_id,
          quantity: item.quantity,
          size_label: sizeLabel,
        });

        if (stockError) {
          console.error("Error decrementing stock:", stockError);
          // Continue processing other items even if one fails
        }
      }

      console.log("Order updated successfully to paid and confirmed");

      // Send payment approved email
      const email = await getUserEmail(order.user_id);
      if (email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        sendNotificationEmail("payment_approved", email, {
          orderId: order.id,
          total: order.total,
          paymentMethod: order.payment_method,
          appUrl,
        });
      }

    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      // Payment rejected or cancelled
      updateData.payment_status = "failed";
      
      console.log("Payment rejected/cancelled, updating order:", orderId);

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order", requestId: correlationId }, { status: 500 });
      }

    } else if (paymentStatus === "in_process" || paymentStatus === "pending") {
      // Payment pending - just update the payment ID
      console.log("Payment pending, updating order:", orderId);

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order", requestId: correlationId }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, requestId: correlationId }, { status: 200 });

  } catch (error) {
    console.error("Error processing MercadoPago webhook", { correlationId, error });
    const errorMessage = error instanceof Error ? error.message : "ERROR INTERNO DEL SERVIDOR";
    return NextResponse.json(
      { error: errorMessage, requestId: correlationId },
      { status: 500 }
    );
  }
}
