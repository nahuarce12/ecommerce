import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/email";
import { isUuid } from "@/lib/validators";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "NO AUTORIZADO" }, { status: 403 });
    }

    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";

    if (!orderId || !isUuid(orderId)) {
      return NextResponse.json({ error: "DATOS INVÁLIDOS" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "ORDEN NO ENCONTRADA" }, { status: 404 });
    }

    const { data: customerProfile } = await serviceClient
      .from("profiles")
      .select("phone")
      .eq("id", order.user_id)
      .single();

    const email = await getUserEmail(order.user_id);

    return NextResponse.json({
      success: true,
      contact: {
        phone: customerProfile?.phone ?? null,
        email,
      },
    });
  } catch (error) {
    console.error("Error fetching order customer contact:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
