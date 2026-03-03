import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendNotificationEmail, getUserEmail } from "@/lib/email";
import { isUuid, isValidPaymentStatus } from "@/lib/validators";

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

    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    const newPaymentStatus = typeof body?.newPaymentStatus === "string" ? body.newPaymentStatus : "";

    if (!orderId || !newPaymentStatus) {
      return NextResponse.json({ error: "DATOS INCOMPLETOS" }, { status: 400 });
    }

    if (!isUuid(orderId) || !isValidPaymentStatus(newPaymentStatus)) {
      return NextResponse.json({ error: "DATOS INVÁLIDOS" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, user_id, payment_status, total, payment_method")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "ORDEN NO ENCONTRADA" }, { status: 404 });
    }

    const { error: updateError } = await serviceClient
      .from("orders")
      .update({ payment_status: newPaymentStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: "ERROR AL ACTUALIZAR" }, { status: 500 });
    }

    if (newPaymentStatus === "paid" && order.payment_status !== "paid") {
      const email = await getUserEmail(order.user_id);
      if (email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        sendNotificationEmail("payment_approved", email, {
          orderId: order.id,
          total: order.total,
          paymentMethod: order.payment_method,
          appUrl,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
