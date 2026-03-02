import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { isValidEmail, sanitizeText } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers);
    const rateLimit = checkRateLimit(`welcome:${ip}`, 5, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "DEMASIADAS SOLICITUDES" }, { status: 429 });
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? sanitizeText(body.email, 120) : "";
    const fullName = typeof body?.fullName === "string" ? sanitizeText(body.fullName, 120) : "Usuario";

    if (!email) {
      return NextResponse.json({ error: "DATOS INCOMPLETOS" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "EMAIL INVÁLIDO" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    sendNotificationEmail("welcome", email, {
      fullName: fullName || "Usuario",
      appUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
