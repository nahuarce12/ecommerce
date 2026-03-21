import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

type RetryOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
};

type RetryOrder = {
  id: string;
  shipping_cost: number;
  payment_status: "failed" | "pending_payment" | "paid";
  order_items: RetryOrderItem[];
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

function normalizeAppUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();
  const urlWithProtocol = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  return new URL(urlWithProtocol).origin;
}

function getAppUrl(request: NextRequest): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    try {
      return normalizeAppUrl(configuredAppUrl);
    } catch {
      throw new Error("NEXT_PUBLIC_APP_URL tiene un formato inválido");
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL es obligatorio en producción");
  }

  return normalizeAppUrl(new URL(request.url).origin);
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

function getHostname(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    const typedOrder = order as RetryOrder;

    // Only allow retry for failed or pending orders
    if (typedOrder.payment_status !== "failed" && typedOrder.payment_status !== "pending_payment") {
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

    const useSandboxInitPoint = process.env.MP_USE_SANDBOX_INIT_POINT?.trim().toLowerCase() === "true";
    const tokenMode = accessToken.startsWith("TEST-") ? "TEST" : "PROD";

    if (useSandboxInitPoint && tokenMode === "PROD") {
      return NextResponse.json(
        {
          error:
            "CONFIGURACION INVALIDA: MP_USE_SANDBOX_INIT_POINT=true requiere credenciales TEST-. Desactiva MP_USE_SANDBOX_INIT_POINT o usa token TEST.",
          debug: {
            tokenMode,
            useSandboxInitPoint,
            appUrl,
            initPointHost: getHostname(response.init_point),
            sandboxInitPointHost: getHostname(response.sandbox_init_point),
          },
        },
        { status: 400 }
      );
    }

    const initPoint = resolveCheckoutUrl(response);

    if (!initPoint) {
      return NextResponse.json(
        { error: "NO SE PUDO OBTENER URL DE CHECKOUT" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferenceId: response.id,
      initPoint,
      debug: {
        tokenMode,
        useSandboxInitPoint,
        appUrl,
        selectedCheckoutHost: getHostname(initPoint),
        initPointHost: getHostname(response.init_point),
        sandboxInitPointHost: getHostname(response.sandbox_init_point),
      },
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
