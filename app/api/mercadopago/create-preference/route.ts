import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { validateMercadoPagoRuntimeConfig } from "@/lib/mercadopago-runtime";

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

type PayerData = {
  email?: string;
  first_name?: string;
  last_name?: string;
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

function buildNotificationUrl(appUrl: string): string {
  const configuredUrl = process.env.MP_NOTIFICATION_URL?.trim();
  const baseUrl = configuredUrl || `${appUrl}/api/mercadopago/webhook`;

  let notificationUrl: URL;
  try {
    notificationUrl = new URL(baseUrl);
  } catch {
    throw new Error("MP_NOTIFICATION_URL tiene un formato inválido");
  }

  if (!notificationUrl.searchParams.has("source_news")) {
    notificationUrl.searchParams.set("source_news", "webhooks");
  }

  return notificationUrl.toString();
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

function resolveMercadoPagoTimeout(): number {
  const raw = process.env.MP_API_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed < 1000) {
    return 10000;
  }

  return Math.floor(parsed);
}

function buildPayerData(params: {
  email: string | undefined;
  fullName: string | null | undefined;
}): PayerData | undefined {
  const payer: PayerData = {};

  if (params.email) {
    payer.email = params.email;
  }

  const normalizedName = params.fullName?.trim();
  if (normalizedName) {
    const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);
    if (firstName) {
      payer.first_name = firstName;
    }
    if (lastNameParts.length > 0) {
      payer.last_name = lastNameParts.join(" ");
    }
  }

  return Object.keys(payer).length > 0 ? payer : undefined;
}

function buildPreferenceExpiration():
  | {
      expires: true;
      expiration_date_from: string;
      expiration_date_to: string;
    }
  | undefined {
  const rawHours = process.env.MP_PREFERENCE_EXPIRATION_HOURS?.trim();
  if (!rawHours) return undefined;

  const hours = Number(rawHours);
  if (!Number.isFinite(hours) || hours <= 0) {
    return undefined;
  }

  const now = new Date();
  const to = new Date(now.getTime() + Math.floor(hours * 60 * 60 * 1000));

  return {
    expires: true,
    expiration_date_from: now.toISOString(),
    expiration_date_to: to.toISOString(),
  };
}

function getHostname(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
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
    const supabase = await createClient();
    const ip = getRequestIp(request.headers);
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const useSandboxInitPoint = process.env.MP_USE_SANDBOX_INIT_POINT?.trim().toLowerCase() === "true";
    const runtimeValidation = validateMercadoPagoRuntimeConfig({
      accessToken,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      useSandboxInitPoint,
    });

    if (!runtimeValidation.valid) {
      return NextResponse.json({ error: runtimeValidation.error, requestId: correlationId }, { status: 500 });
    }
    const resolvedAccessToken = accessToken as string;

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const payer = buildPayerData({
      email: user.email,
      fullName: profileData?.full_name,
    });

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken: resolvedAccessToken,
      options: {
        timeout: resolveMercadoPagoTimeout(),
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
    const excludeAccountMoney = shouldExcludeAccountMoney(resolvedAccessToken);
    const notificationUrl = buildNotificationUrl(appUrl);
    const preferenceExpiration = buildPreferenceExpiration();

    console.log("Creating MercadoPago preference", {
      correlationId,
      orderId,
      userId: user.id,
      appUrl,
    });

    // Create preference - NO enviar payer info para evitar pre-autenticación en sandbox
    const preferenceData = {
      items,
      ...(payer ? { payer } : {}),
      back_urls: {
        success: `${appUrl}/checkout/success/${orderId}?status=approved`,
        failure: `${appUrl}/checkout/success/${orderId}?status=failure`,
        pending: `${appUrl}/checkout/success/${orderId}?status=pending`,
      },
      auto_return: "approved" as const,
      notification_url: notificationUrl,
      external_reference: orderId,
      statement_descriptor: "SUPPLY STORE",
      ...(preferenceExpiration ?? {}),
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

    console.log("MercadoPago preference created", {
      correlationId,
      orderId,
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

    const tokenMode = resolvedAccessToken.startsWith("TEST-") ? "TEST" : "PROD";
    const debugInfo = {
      tokenMode,
      useSandboxInitPoint,
      appUrl,
      initPointHost: getHostname(response.init_point),
      sandboxInitPointHost: getHostname(response.sandbox_init_point),
    };

    if (useSandboxInitPoint && tokenMode === "PROD") {
      return NextResponse.json(
        {
          error:
            "CONFIGURACION INVALIDA: MP_USE_SANDBOX_INIT_POINT=true requiere credenciales TEST-. Desactiva MP_USE_SANDBOX_INIT_POINT o usa token TEST.",
          requestId: correlationId,
          debug: isProduction() ? undefined : debugInfo,
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
    console.log("Returning checkout URL", {
      correlationId,
      orderId,
      selectedCheckoutHost: getHostname(initPoint),
    });

    return NextResponse.json({
      success: true,
      requestId: correlationId,
      preferenceId: response.id,
      initPoint,
      debug: isProduction()
        ? undefined
        : {
        ...debugInfo,
        selectedCheckoutHost: getHostname(initPoint),
      },
    });

  } catch (error) {
    console.error("Error creating MercadoPago preference", { correlationId, error });
    
    // Extract detailed error information
    let errorMessage = "ERROR INTERNO DEL SERVIDOR";
    let errorDetails = {};
    
    if (error && typeof error === 'object') {
      if ('message' in error) errorMessage = String(error.message);
      if ('cause' in error) errorDetails = { ...errorDetails, cause: error.cause };
      if ('status' in error) errorDetails = { ...errorDetails, status: error.status };
      if ('error' in error) errorDetails = { ...errorDetails, error: error.error };
    }
    
    console.error("Detailed MercadoPago preference error", { correlationId, errorDetails });
    
    return NextResponse.json(
      { 
        requestId: correlationId,
        error: errorMessage,
        details:
          !isProduction() && Object.keys(errorDetails).length > 0
            ? errorDetails
            : undefined,
      },
      { status: 500 }
    );
  }
}
