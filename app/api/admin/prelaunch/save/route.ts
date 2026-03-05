import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashPrelaunchPassword } from "@/lib/prelaunch-password";
import {
  getDefaultPrelaunchSettings,
  normalizeLaunchAt,
  PRELAUNCH_TIMEZONE,
} from "@/lib/prelaunch-settings";

type SavePayload = {
  enabled?: boolean;
  launchAt?: string;
  timezone?: string;
  password?: string;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "NO AUTENTICADO" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "NO AUTORIZADO" }, { status: 403 }) };
  }

  return { supabase, userId: user.id };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if ("error" in admin) return admin.error;

    const { data, error } = await admin.supabase
      .from("prelaunch_settings")
      .select("enabled, launch_at, timezone, password_version, updated_at")
      .eq("id", true)
      .single();

    if (error || !data) {
      const fallback = getDefaultPrelaunchSettings();
      return NextResponse.json({
        enabled: fallback.enabled,
        launchAt: fallback.launchAt,
        timezone: fallback.timezone,
        passwordVersion: fallback.passwordVersion,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      enabled: data.enabled,
      launchAt: normalizeLaunchAt(data.launch_at),
      timezone: data.timezone || PRELAUNCH_TIMEZONE,
      passwordVersion: data.password_version,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error("Error loading prelaunch settings:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ("error" in admin) return admin.error;

    const body = (await request.json()) as SavePayload;

    const launchAt = normalizeLaunchAt(body.launchAt);
    const timezone = body.timezone?.trim() || PRELAUNCH_TIMEZONE;
    const enabled = Boolean(body.enabled);
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES" },
        { status: 400 },
      );
    }

    const updatePayload: {
      enabled: boolean;
      launch_at: string;
      timezone: string;
      updated_by: string;
      updated_at: string;
      password_hash?: string;
      password_version?: number;
    } = {
      enabled,
      launch_at: launchAt,
      timezone,
      updated_by: admin.userId,
      updated_at: new Date().toISOString(),
    };

    if (password) {
      updatePayload.password_hash = hashPrelaunchPassword(password);
    }

    const { data: current } = await admin.supabase
      .from("prelaunch_settings")
      .select("password_version, password_hash")
      .eq("id", true)
      .single();

    const hasStoredPassword = Boolean(current?.password_hash);
    if (enabled && !password && !hasStoredPassword) {
      return NextResponse.json(
        { error: "DEFINÍ UNA CONTRASEÑA ANTES DE ACTIVAR EL PRE-LANZAMIENTO" },
        { status: 400 },
      );
    }

    if (password) {
      updatePayload.password_version = (current?.password_version || 1) + 1;
    }

    const { error } = await admin.supabase
      .from("prelaunch_settings")
      .upsert({ id: true, ...updatePayload }, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: "ERROR AL GUARDAR AJUSTES" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving prelaunch settings:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
