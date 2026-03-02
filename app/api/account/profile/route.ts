import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateProfileInput } from "@/lib/validators";

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

    const body = await request.json();
    const requireShipping = body?.requireShipping === true;

    const validation = validateProfileInput(body, requireShipping);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, fields: validation.fields },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(validation.data)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "ERROR AL ACTUALIZAR PERFIL" }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
