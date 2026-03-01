import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "NO AUTENTICADO" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "NO AUTORIZADO" }, { status: 403 });
    }

    const { orderId, trackingNumber } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "DATOS INCOMPLETOS" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { error: updateError } = await serviceClient
      .from("orders")
      .update({ tracking_number: trackingNumber, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: "ERROR AL ACTUALIZAR" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tracking:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
