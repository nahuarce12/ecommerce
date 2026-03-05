import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getRequestIp, checkRateLimit } from "@/lib/rate-limit";
import {
  PRELAUNCH_ACCESS_COOKIE,
  createPrelaunchAccessToken,
} from "@/lib/prelaunch-access-token";
import { verifyPrelaunchPassword } from "@/lib/prelaunch-password";

const PRELAUNCH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers);
    const limiter = checkRateLimit(`prelaunch:${ip}`, 10, 60_000);

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "DEMASIADOS INTENTOS. INTENTÁ NUEVAMENTE EN UN MINUTO." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!password) {
      return NextResponse.json({ error: "INGRESÁ UNA CONTRASEÑA" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("prelaunch_settings")
      .select("enabled, launch_at, password_hash, password_version")
      .eq("id", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "CONFIGURACIÓN NO DISPONIBLE" }, { status: 500 });
    }

    const launchReached = Date.now() >= new Date(data.launch_at).getTime();
    if (!data.enabled || launchReached) {
      return NextResponse.json({ success: true, autoOpen: true });
    }

    if (!data.password_hash) {
      return NextResponse.json({ error: "CONTRASEÑA NO CONFIGURADA" }, { status: 500 });
    }

    const isValidPassword = verifyPrelaunchPassword(password, data.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "CONTRASEÑA INVÁLIDA" }, { status: 401 });
    }

    const token = await createPrelaunchAccessToken(data.password_version);
    if (!token) {
      return NextResponse.json({ error: "TOKEN SECRET NO CONFIGURADO" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: PRELAUNCH_ACCESS_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: PRELAUNCH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Error verifying prelaunch password:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
