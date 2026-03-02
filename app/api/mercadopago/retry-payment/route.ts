import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

function shouldExcludeAccountMoney(accessToken: string): boolean {
  const override = process.env.MP_EXCLUDE_ACCOUNT_MONEY?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  if (accessToken.startsWith("TEST-")) {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

function getAppUrl(request: NextRequest): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL es obligatorio en producción");
  }

  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "MP_ACCESS_TOKEN NO CONFIGURADO" },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "NO AUTENTICADO" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "ORDEN ID REQUERIDO" },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ORDEN NO ENCONTRADA" },
        { status: 404 }
      );
    }

    // Only allow retry for failed or pending orders
    if (order.payment_status !== "failed" && order.payment_status !== "pending_payment") {
      return NextResponse.json(
        { error: "ORDEN NO PUEDE SER REPROCESADA" },
        { status: 400 }
      );
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      }
    });

    const preference = new Preference(client);

    // Build items array
    const items = order.order_items.map((item: any) => ({
      id: item.product_id || item.id,
      title: item.product_name,
      description: `${item.size} - ${item.color}`,
      quantity: item.quantity,
      unit_price: Number(item.price_at_purchase),
      currency_id: "ARS",
    }));

    // Add shipping as a separate item if applicable
    if (order.shipping_cost && order.shipping_cost > 0) {
      items.push({
        id: "shipping",
        title: "Envío",
        description: "Costo de envío",
        quantity: 1,
        unit_price: Number(order.shipping_cost),
        currency_id: "ARS",
      });
    }

    const appUrl = getAppUrl(request);
    const excludeAccountMoney = shouldExcludeAccountMoney(accessToken);

    // Create new preference - NO enviar payer info para evitar pre-autenticación en sandbox
    const preferenceData = {
      items,
      back_urls: {
        success: `${appUrl}/checkout/success/${orderId}?status=approved`,
        failure: `${appUrl}/checkout/success/${orderId}?status=failure`,
        pending: `${appUrl}/checkout/success/${orderId}?status=pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      external_reference: orderId,
      statement_descriptor: "SUPPLY STORE",
      ...(excludeAccountMoney
        ? {
            payment_methods: {
              excluded_payment_methods: [{ id: "account_money" }],
            },
          }
        : {}),
    };

    const response = await preference.create({ body: preferenceData });

    // Update order with new preference_id and reset to pending_payment
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        mercadopago_preference_id: response.id,
        payment_status: "pending_payment",
        // Clear previous payment/merchant order IDs for new attempt
        mercadopago_payment_id: null,
        mercadopago_merchant_order_id: null,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with preference_id:", updateError);
    }

    return NextResponse.json({
      success: true,
      preferenceId: response.id,
      initPoint: response.sandbox_init_point || response.init_point,
    });

  } catch (error) {
    console.error("Error retrying MercadoPago payment:", error);
    const errorMessage = error instanceof Error ? error.message : "ERROR INTERNO DEL SERVIDOR";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
