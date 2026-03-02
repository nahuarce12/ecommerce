import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateShipping } from "@/lib/shipping-calculator";
import { formatShippingAddress } from "@/lib/shipping-helpers";
import { sendNotificationEmail } from "@/lib/email";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { isUuid, sanitizeText } from "@/lib/validators";

type CreateOrderItemPayload = {
  product?: {
    id?: string;
    name?: string;
    price?: number;
  };
  size?: string;
  color?: string;
  quantity?: number;
};

type ValidatedOrderItem = {
  product: {
    id: string;
    name: string;
    price: number;
  };
  size: string;
  color: string;
  quantity: number;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "NO AUTENTICADO" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const paymentMethod = typeof body?.paymentMethod === "string" ? body.paymentMethod : "";
    const shippingCity = typeof body?.shippingCity === "string" ? sanitizeText(body.shippingCity, 120) : "";
    const shippingProvince = typeof body?.shippingProvince === "string" ? sanitizeText(body.shippingProvince, 120) : "";

    if (!paymentMethod || !shippingCity || !shippingProvince) {
      return NextResponse.json(
        { error: "DATOS INCOMPLETOS" },
        { status: 400 }
      );
    }

    const enabledMethods = getEnabledPaymentMethods().map((method) => method.id);
    if (!enabledMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "MÉTODO DE PAGO INVÁLIDO" },
        { status: 400 }
      );
    }

    // Get user profile for shipping address
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "PERFIL NO ENCONTRADO" },
        { status: 400 }
      );
    }

    // Validate shipping info is complete
    if (!profile.phone || !profile.address_line1 || !profile.city || !profile.state_province || !profile.postal_code) {
      return NextResponse.json(
        { error: "DIRECCIÓN DE ENVÍO INCOMPLETA" },
        { status: 400 }
      );
    }

    // Get cart from request (we'll pass it from the client)
    const items = Array.isArray(body?.items) ? (body.items as CreateOrderItemPayload[]) : [];
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "CARRITO VACÍO" },
        { status: 400 }
      );
    }

    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of items) {
      const productId = typeof item?.product?.id === "string" ? item.product.id : "";
      const productName = typeof item?.product?.name === "string" ? item.product.name : "";
      const productPrice = typeof item?.product?.price === "number" ? item.product.price : 0;
      const size = typeof item?.size === "string" ? sanitizeText(item.size, 50) : "";
      const color = typeof item?.color === "string" ? sanitizeText(item.color, 50) : "";
      const quantity = item?.quantity;

      if (!productId || !productName || !size || !color || !isPositiveInteger(quantity)) {
        return NextResponse.json(
          { error: "ITEMS INVÁLIDOS EN EL CARRITO" },
          { status: 400 }
        );
      }

      if (!isUuid(productId) || quantity > 50) {
        return NextResponse.json(
          { error: "ITEMS INVÁLIDOS EN EL CARRITO" },
          { status: 400 }
        );
      }

      validatedItems.push({
        product: {
          id: productId,
          name: productName,
          price: productPrice,
        },
        size,
        color,
        quantity,
      });
    }

    // Calculate shipping
    const shipping = calculateShipping(shippingCity, shippingProvince);

    // Start transaction: validate stock and create order
    let orderId: string | null = null;
    let orderTotal = 0;

    // Validate stock for all items
    for (const item of validatedItems) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock, price")
        .eq("id", item.product.id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: `PRODUCTO ${item.product.name} NO ENCONTRADO` },
          { status: 400 }
        );
      }

      // Check per-size stock if applicable
      const itemSize = item.size || 'ÚNICO';
      if (itemSize !== 'ÚNICO') {
        const { data: sizeData } = await supabase
          .from("product_sizes")
          .select("stock")
          .eq("product_id", item.product.id)
          .eq("size_label", itemSize)
          .single();

        if (sizeData) {
          if (sizeData.stock < item.quantity) {
            return NextResponse.json(
              { error: `STOCK INSUFICIENTE PARA ${item.product.name} TALLE ${itemSize}. DISPONIBLE: ${sizeData.stock}` },
              { status: 400 }
            );
          }
        } else if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `STOCK INSUFICIENTE PARA ${item.product.name}. DISPONIBLE: ${product.stock}` },
            { status: 400 }
          );
        }
      } else if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `STOCK INSUFICIENTE PARA ${item.product.name}. DISPONIBLE: ${product.stock}` },
          { status: 400 }
        );
      }

      orderTotal += product.price * item.quantity;
    }

    // Create order
    const shippingAddress = formatShippingAddress(profile);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        payment_status: "pending_payment",
        total: orderTotal + shipping.cost,
        shipping_cost: shipping.cost,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "ERROR AL CREAR LA ORDEN" },
        { status: 500 }
      );
    }

    orderId = order.id;

    // Create order items and update stock (skip stock decrement for MercadoPago)
    const shouldDecrementStock = paymentMethod !== "mercadopago";

    for (const item of validatedItems) {
      // Get current price
      const { data: product } = await supabase
        .from("products")
        .select("price")
        .eq("id", item.product.id)
        .single();

      // Insert order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderId,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price_at_purchase: product?.price || item.product.price,
          size: item.size || 'ÚNICO',
          color: item.color || 'DEFAULT',
        });

      if (itemError) {
        console.error("Error creating order item:", itemError);
        console.error("Item data attempted:", {
          order_id: orderId,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price_at_purchase: product?.price || item.product.price,
          size: item.size,
          color: item.color,
        });
        // Rollback: delete order
        await supabase.from("orders").delete().eq("id", orderId);
        return NextResponse.json(
          { error: `ERROR AL CREAR LOS ITEMS DEL PEDIDO: ${itemError.message || JSON.stringify(itemError)}` },
          { status: 500 }
        );
      }

      // Update stock only if not MercadoPago (stock will be decremented after payment confirmation)
      if (shouldDecrementStock) {
        const sizeLabel = item.size || 'ÚNICO';
        const { error: stockError } = await supabase.rpc("decrement_stock", {
          product_id: item.product.id,
          quantity: item.quantity,
          size_label: sizeLabel !== 'ÚNICO' ? sizeLabel : null,
        });

        if (stockError) {
          console.error("Error updating stock:", stockError);
          console.error("Stock error details:", JSON.stringify(stockError, null, 2));
          // Rollback: delete order and items
          await supabase.from("orders").delete().eq("id", orderId);
          return NextResponse.json(
            { error: `ERROR AL ACTUALIZAR EL STOCK: ${stockError.message || 'Función decrement_stock no existe en la base de datos'}` },
            { status: 500 }
          );
        }
      }
    }

    // Send order confirmation email (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    sendNotificationEmail("order_confirmation", user.email!, {
      orderId,
      items: orderItems || [],
      total: orderTotal + shipping.cost,
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
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
