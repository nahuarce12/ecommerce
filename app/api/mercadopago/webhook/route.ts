import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { sendNotificationEmail, getUserEmail } from "@/lib/email";
import { verifyMercadoPagoWebhookSecurity } from "@/lib/webhook-security";

type WebhookPayload = {
  type?: string;
  topic?: string;
  data?: { id?: string | number };
  resource?: string | number;
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "MP_ACCESS_TOKEN NO CONFIGURADO" }, { status: 500 });
    }

    const webhookSecret = process.env.MP_WEBHOOK_SECRET?.trim();

    // Get notification data from MercadoPago
    const body = (await request.json()) as WebhookPayload;
    console.log("MercadoPago webhook received:", body);

    if (webhookSecret) {
      const securityCheck = verifyMercadoPagoWebhookSecurity({
        signatureHeader: request.headers.get("x-signature"),
        requestIdHeader: request.headers.get("x-request-id"),
        dataId: body.data?.id ?? body.resource,
        secret: webhookSecret,
      });

      if (!securityCheck.valid) {
        console.error("MercadoPago webhook rejected:", securityCheck.reason);
        return NextResponse.json({ error: "INVALID SIGNATURE" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("MercadoPago webhook rejected: MP_WEBHOOK_SECRET missing in production");
      return NextResponse.json({ error: "WEBHOOK SECRET NOT CONFIGURED" }, { status: 500 });
    }

    // MercadoPago sends notifications in different formats
    // Format 1 (old): { resource: "123", topic: "payment" }
    // Format 2 (new): { type: "payment", data: { id: "123" }, action: "payment.created" }
    
    const { type, topic, data, resource } = body;
    const notificationType = type || topic;
    
    // We only process payment notifications
    if (notificationType !== "payment") {
      console.log("Ignoring non-payment notification:", notificationType);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Get payment ID from either format
    const paymentId = data?.id || resource;
    
    if (!paymentId) {
      console.error("No payment ID in webhook data");
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      }
    });

    const payment = new Payment(client);

    // Get payment details from MercadoPago API
    const paymentData = await payment.get({ id: paymentId });
    console.log("Payment data from MercadoPago:", paymentData);

    if (!paymentData.external_reference) {
      console.error("No external_reference (order_id) in payment");
      return NextResponse.json({ error: "No order reference" }, { status: 400 });
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
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order based on payment status
    let updateData: any = {
      mercadopago_payment_id: paymentIdString,
      mercadopago_merchant_order_id: merchantOrderId,
    };

    if (paymentStatus === "approved") {
      // Payment approved - update to paid and confirmed
      updateData.payment_status = "paid";
      updateData.status = "confirmed";

      console.log("Payment approved, updating order:", orderId);

      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order" }, { status: 500 });
      }

      // Decrement stock for each item (only if not already decremented)
      if (order.status === "pending" && order.payment_status === "pending_payment") {
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
        return NextResponse.json({ error: "Error updating order" }, { status: 500 });
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
        return NextResponse.json({ error: "Error updating order" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error processing MercadoPago webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "ERROR INTERNO DEL SERVIDOR";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
