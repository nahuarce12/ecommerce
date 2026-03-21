import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BANK_INFO, WHATSAPP_NUMBER } from "@/lib/payment-methods";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const REVEAL_WINDOW_SECONDS = 600;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "NO AUTENTICADO" }, { status: 401 });
    }

    const ip = getRequestIp(request.headers);
    const rateLimit = checkRateLimit(`bank-info:${user.id}:${ip}`, 12, RATE_LIMIT_WINDOW_MS);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "DEMASIADAS SOLICITUDES" }, { status: 429 });
    }

    return NextResponse.json(
      {
        bankInfo: BANK_INFO,
        whatsappNumber: WHATSAPP_NUMBER,
        revealWindowSeconds: REVEAL_WINDOW_SECONDS,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error loading secure bank info:", error);
    return NextResponse.json({ error: "ERROR INTERNO DEL SERVIDOR" }, { status: 500 });
  }
}