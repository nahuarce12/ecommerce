type MercadoPagoRuntimeOptions = {
  accessToken: string | null | undefined;
  appUrl?: string | null;
  webhookSecret?: string | null;
  useSandboxInitPoint?: boolean;
  requireWebhookSecretInProduction?: boolean;
};

type MercadoPagoRuntimeValidationResult =
  | { valid: true }
  | { valid: false; error: string };

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyDevelopmentHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".devtunnels.ms") ||
      hostname.endsWith(".github.dev")
    );
  } catch {
    return false;
  }
}

export function validateMercadoPagoRuntimeConfig(
  options: MercadoPagoRuntimeOptions,
): MercadoPagoRuntimeValidationResult {
  const token = options.accessToken?.trim();
  if (!token) {
    return { valid: false, error: "MP_ACCESS_TOKEN NO CONFIGURADO" };
  }

  if (options.useSandboxInitPoint && !token.startsWith("TEST-")) {
    return {
      valid: false,
      error:
        "CONFIGURACION INVALIDA: MP_USE_SANDBOX_INIT_POINT=true requiere credenciales TEST-.",
    };
  }

  if (!isProduction()) {
    return { valid: true };
  }

  if (!options.appUrl?.trim()) {
    return {
      valid: false,
      error: "NEXT_PUBLIC_APP_URL es obligatorio en producción",
    };
  }

  if (!isValidHttpsUrl(options.appUrl)) {
    return {
      valid: false,
      error: "NEXT_PUBLIC_APP_URL debe ser una URL HTTPS válida en producción",
    };
  }

  if (isLikelyDevelopmentHost(options.appUrl)) {
    return {
      valid: false,
      error:
        "NEXT_PUBLIC_APP_URL apunta a un host de desarrollo; configurá un dominio productivo.",
    };
  }

  if (options.requireWebhookSecretInProduction && !options.webhookSecret?.trim()) {
    return {
      valid: false,
      error: "MP_WEBHOOK_SECRET NO CONFIGURADO EN PRODUCCION",
    };
  }

  return { valid: true };
}
