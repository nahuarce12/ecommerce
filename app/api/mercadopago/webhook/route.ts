import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function POST(request: NextRequest) {
  try {
    // Get notification data from MercadoPago
    const body = await request.json();
    console.log("MercadoPago webhook received:", body);

    // MercadoPago sends notifications in different formats
    // Format 1 (old): { resource: "123", topic: "payment" }
    // Format 2 (new): { type: "payment", data: { id: "123" }, action: "payment.created" }
    
    const { type, topic, data, resource } = body;
    const notificationType = type || topic;
    
    // We only process payment notifications
    if (notificationType !== "payment") {
      console.log("Ignoring non-payment notification:", notificationType);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Get payment ID from either format
    const paymentId = data?.id || resource;
    
    if (!paymentId) {
      console.error("No payment ID in webhook data");
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
      options: {
        timeout: 5000,
      }
    });

    const payment = new Payment(client);

    // Get payment details from MercadoPago API
    const paymentData = await payment.get({ id: paymentId });
    console.log("Payment data from MercadoPago:", paymentData);

    if (!paymentData.external_reference) {
      console.error("No external_reference (order_id) in payment");
      return NextResponse.json({ error: "No order reference" }, { status: 400 });
    }

    const orderId = paymentData.external_reference;
    const paymentStatus = paymentData.status;
    const paymentIdString = paymentData.id?.toString();
    const merchantOrderId = paymentData.order?.id?.toString();

    // Create Supabase service client (bypasses RLS for webhook operations)
    const supabase = createServiceClient();

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order based on payment status
    let updateData: any = {
      mercadopago_payment_id: paymentIdString,
      mercadopago_merchant_order_id: merchantOrderId,
    };

    if (paymentStatus === "approved") {
      // Payment approved - update to paid and confirmed
      updateData.payment_status = "paid";
      updateData.status = "confirmed";

      console.log("Payment approved, updating order:", orderId);

      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order" }, { status: 500 });
      }

      // Decrement stock for each item (only if not already decremented)
      if (order.status === "pending" && order.payment_status === "pending_payment") {
        for (const item of order.order_items) {
          const { error: stockError } = await supabase.rpc("decrement_stock", {
            product_id: item.product_id,
            quantity: item.quantity,
          });

          if (stockError) {
            console.error("Error decrementing stock:", stockError);
            // Continue processing other items even if one fails
          }
        }
      }

      console.log("Order updated successfully to paid and confirmed");

    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      // Payment rejected or cancelled
      updateData.payment_status = "failed";
      
      console.log("Payment rejected/cancelled, updating order:", orderId);

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order" }, { status: 500 });
      }

    } else if (paymentStatus === "in_process" || paymentStatus === "pending") {
      // Payment pending - just update the payment ID
      console.log("Payment pending, updating order:", orderId);

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return NextResponse.json({ error: "Error updating order" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error processing MercadoPago webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "ERROR INTERNO DEL SERVIDOR";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
