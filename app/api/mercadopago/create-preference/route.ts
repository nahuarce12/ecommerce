import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

type PreferenceOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
};

type PreferenceOrder = {
  id: string;
  shipping_cost: number;
  order_items: PreferenceOrderItem[];
};

function shouldExcludeAccountMoney(accessToken: string): boolean {
  const override = process.env.MP_EXCLUDE_ACCOUNT_MONEY?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  return accessToken.startsWith("TEST-");
}

function isAccountMoneyExclusionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const message = "message" in error ? String(error.message).toLowerCase() : "";
  const apiError = "error" in error ? String(error.error).toLowerCase() : "";

  return (
    message.includes("account_money cannot be excluded") ||
    apiError.includes("account_money cannot be excluded")
  );
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

function resolveCheckoutUrl(response: { init_point?: string | null; sandbox_init_point?: string | null }): string | null {
  const useSandboxInitPoint = process.env.MP_USE_SANDBOX_INIT_POINT?.trim().toLowerCase() === "true";

  if (useSandboxInitPoint) {
    if (response.sandbox_init_point) {
      return response.sandbox_init_point;
    }

    console.error(
      "MP_USE_SANDBOX_INIT_POINT=true pero Mercado Pago no devolvió sandbox_init_point. Revisá que estés usando credenciales TEST."
    );
    return null;
  }

  return response.init_point || response.sandbox_init_point || null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ip = getRequestIp(request.headers);
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

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

    const rateLimit = checkRateLimit(`mp-preference:${user.id}:${ip}`, 12, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "DEMASIADAS SOLICITUDES" },
        { status: 429 }
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
      .select("id, shipping_cost, order_items(id, product_id, product_name, size, color, quantity, price_at_purchase)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ORDEN NO ENCONTRADA" },
        { status: 404 }
      );
    }

    const typedOrder = order as PreferenceOrder;

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      }
    });

    const preference = new Preference(client);

    // Build items array
    const items = typedOrder.order_items.map((item) => ({
      id: item.product_id || item.id,
      title: item.product_name,
      description: `${item.size} - ${item.color}`,
      quantity: item.quantity,
      unit_price: Number(item.price_at_purchase),
      currency_id: "ARS",
    }));

    // Add shipping as a separate item if applicable
    if (typedOrder.shipping_cost && typedOrder.shipping_cost > 0) {
      items.push({
        id: "shipping",
        title: "Envío",
        description: "Costo de envío",
        quantity: 1,
        unit_price: Number(typedOrder.shipping_cost),
        currency_id: "ARS",
      });
    }

    const appUrl = getAppUrl(request);
    const excludeAccountMoney = shouldExcludeAccountMoney(accessToken);

    console.log("Using app URL:", appUrl);
    console.log("Creating preference for order:", orderId);

    // Create preference - NO enviar payer info para evitar pre-autenticación en sandbox
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

    console.log("Preference data:", JSON.stringify(preferenceData, null, 2));

    let response;
    try {
      response = await preference.create({ body: preferenceData });
    } catch (error) {
      if (excludeAccountMoney && isAccountMoneyExclusionError(error)) {
        console.warn("MercadoPago rejected account_money exclusion, retrying without exclusion");
        const fallbackPreferenceData = { ...preferenceData } as typeof preferenceData & {
          payment_methods?: unknown;
        };
        delete fallbackPreferenceData.payment_methods;
        response = await preference.create({ body: fallbackPreferenceData });
      } else {
        throw error;
      }
    }

    console.log("Preference response:", {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      date_created: response.date_created,
    });

    // Update order with preference_id
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        mercadopago_preference_id: response.id,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with preference_id:", updateError);
    }

    const initPoint = resolveCheckoutUrl(response);

    if (!initPoint) {
      return NextResponse.json(
        { error: "NO SE PUDO OBTENER URL DE CHECKOUT" },
        { status: 500 }
      );
    }
    console.log("Redirecting to:", initPoint);

    return NextResponse.json({
      success: true,
      preferenceId: response.id,
      initPoint,
    });

  } catch (error) {
    console.error("Error creating MercadoPago preference:", error);
    
    // Extract detailed error information
    let errorMessage = "ERROR INTERNO DEL SERVIDOR";
    let errorDetails = {};
    
    if (error && typeof error === 'object') {
      if ('message' in error) errorMessage = String(error.message);
      if ('cause' in error) errorDetails = { ...errorDetails, cause: error.cause };
      if ('status' in error) errorDetails = { ...errorDetails, status: error.status };
      if ('error' in error) errorDetails = { ...errorDetails, error: error.error };
    }
    
    console.error("Detailed error:", errorDetails);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: Object.keys(errorDetails).length > 0 ? errorDetails : undefined 
      },
      { status: 500 }
    );
  }
}
