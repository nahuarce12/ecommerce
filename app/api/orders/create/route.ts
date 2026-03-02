import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateShipping } from "@/lib/shipping-calculator";
import { formatShippingAddress } from "@/lib/shipping-helpers";
import { sendNotificationEmail } from "@/lib/email";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { validateCreateOrderInput } from "@/lib/validators";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

type ValidatedOrderItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

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
    const rateLimit = checkRateLimit(`create-order:${user.id}:${ip}`, 8, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "DEMASIADAS SOLICITUDES" }, { status: 429 });
    }

    const body = await request.json();
    const requestValidation = validateCreateOrderInput(body);

    if (!requestValidation.success) {
      return NextResponse.json(
        { error: requestValidation.error, fields: requestValidation.fields },
        { status: 400 },
      );
    }

    const {
      paymentMethod,
      shippingCity: requestShippingCity,
      shippingProvince: requestShippingProvince,
      items,
    } = requestValidation.data;

    const enabledMethods = getEnabledPaymentMethods().map((method) => method.id);
    if (!enabledMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "MÉTODO DE PAGO INVÁLIDO" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address_line1, address_line2, city, state_province, postal_code, country")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "PERFIL NO ENCONTRADO" }, { status: 400 });
    }

    const effectiveShippingCity =
      (typeof profile.city === "string" ? profile.city.trim() : "") || requestShippingCity;
    const effectiveShippingProvince =
      (typeof profile.state_province === "string" ? profile.state_province.trim() : "") ||
      requestShippingProvince;

    if (
      !profile.phone ||
      !profile.address_line1 ||
      !profile.postal_code ||
      !effectiveShippingCity ||
      !effectiveShippingProvince
    ) {
      return NextResponse.json({ error: "DIRECCIÓN DE ENVÍO INCOMPLETA" }, { status: 400 });
    }

    const validatedItems: ValidatedOrderItem[] = items.map((item) => ({
      productId: item.product.id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    }));

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: "CARRITO VACÍO" }, { status: 400 });
    }

    const shipping = calculateShipping(effectiveShippingCity, effectiveShippingProvince);
    const shippingAddress = formatShippingAddress({
      ...profile,
      city: effectiveShippingCity,
      state_province: effectiveShippingProvince,
    });

    const shouldDecrementStock = paymentMethod !== "mercadopago";

    const rpcItems = validatedItems.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      size: item.size || "ÚNICO",
      color: item.color || "DEFAULT",
    }));

    const { data: orderId, error: rpcError } = await supabase.rpc("create_order_with_items", {
      p_payment_method: paymentMethod,
      p_shipping_cost: shipping.cost,
      p_shipping_address: shippingAddress,
      p_items: rpcItems,
      p_should_decrement_stock: shouldDecrementStock,
    });

    if (rpcError || !orderId) {
      const rpcMessage = rpcError?.message || "ERROR AL CREAR LA ORDEN";
      const isStockError = rpcMessage.toLowerCase().includes("stock");
      return NextResponse.json({ error: rpcMessage }, { status: isStockError ? 400 : 500 });
    }

    const [orderResult, orderItemsResult] = await Promise.all([
      supabase.from("orders").select("total").eq("id", orderId).single(),
      supabase.from("order_items").select("*").eq("order_id", orderId),
    ]);

    const total = Number(orderResult.data?.total || 0);
    const orderItems = orderItemsResult.data || [];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    sendNotificationEmail("order_confirmation", user.email!, {
      orderId,
      items: orderItems,
      total,
      shippingCost: shipping.cost,
      shippingAddress,
      paymentMethod,
      appUrl,
    });

    return NextResponse.json({
      success: true,
      orderId,
      message: "PEDIDO CREADO EXITOSAMENTE",
    });
  } catch (error) {
    console.error("Error in order creation:", error);
    const errorMessage = error instanceof Error ? error.message : "ERROR INTERNO DEL SERVIDOR";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
