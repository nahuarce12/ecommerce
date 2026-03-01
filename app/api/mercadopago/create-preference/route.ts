import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "ORDEN ID REQUERIDO" },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ORDEN NO ENCONTRADA" },
        { status: 404 }
      );
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
      options: {
        timeout: 5000,
      }
    });

    const preference = new Preference(client);

    // Build items array
    const items = order.order_items.map((item: any) => ({
      id: item.product_id || item.id,
      title: item.product_name,
      description: `${item.size} - ${item.color}`,
      quantity: item.quantity,
      unit_price: Number(item.price_at_purchase),
      currency_id: "ARS",
    }));

    // Add shipping as a separate item if applicable
    if (order.shipping_cost && order.shipping_cost > 0) {
      items.push({
        id: "shipping",
        title: "Envío",
        description: "Costo de envío",
        quantity: 1,
        unit_price: Number(order.shipping_cost),
        currency_id: "ARS",
      });
    }

    // Get app URL with proper validation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://2q4d6smw-3000.brs.devtunnels.ms";
    
    if (!appUrl) {
      return NextResponse.json(
        { error: "CONFIGURACIÓN DE URL NO ENCONTRADA" },
        { status: 500 }
      );
    }

    console.log("Using app URL:", appUrl);
    console.log("Creating preference for order:", orderId);

    // Create preference - NO enviar payer info para evitar pre-autenticación en sandbox
    const preferenceData = {
      items,
      back_urls: {
        success: `${appUrl}/checkout/success/${orderId}?status=approved`,
        failure: `${appUrl}/checkout/success/${orderId}?status=failure`,
        pending: `${appUrl}/checkout/success/${orderId}?status=pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      external_reference: orderId,
      statement_descriptor: "SUPPLY STORE",
    };

    console.log("Preference data:", JSON.stringify(preferenceData, null, 2));

    const response = await preference.create({ body: preferenceData });

    console.log("Preference response:", {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      date_created: response.date_created,
    });

    // Update order with preference_id
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        mercadopago_preference_id: response.id,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with preference_id:", updateError);
    }

    const initPoint = response.sandbox_init_point || response.init_point;
    console.log("Redirecting to:", initPoint);

    return NextResponse.json({
      success: true,
      preferenceId: response.id,
      initPoint,
    });

  } catch (error) {
    console.error("Error creating MercadoPago preference:", error);
    
    // Extract detailed error information
    let errorMessage = "ERROR INTERNO DEL SERVIDOR";
    let errorDetails = {};
    
    if (error && typeof error === 'object') {
      if ('message' in error) errorMessage = String(error.message);
      if ('cause' in error) errorDetails = { ...errorDetails, cause: error.cause };
      if ('status' in error) errorDetails = { ...errorDetails, status: error.status };
      if ('error' in error) errorDetails = { ...errorDetails, error: error.error };
    }
    
    console.error("Detailed error:", errorDetails);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: Object.keys(errorDetails).length > 0 ? errorDetails : undefined 
      },
      { status: 500 }
    );
  }
}
