import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, MessageCircle, ArrowLeft, Eye, CreditCard, RefreshCw } from "lucide-react";
import { BANK_INFO, WHATSAPP_NUMBER, generateWhatsAppLink } from "@/lib/payment-methods";
import { RetryPaymentButton } from "@/components/checkout/retry-payment-button";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const { status: mpStatus } = await searchParams;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get order with items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_at_purchase,
        size,
        color,
        product:products (
          id,
          name,
          images
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    redirect("/");
  }

  // Verify order belongs to user
  if (order.user_id !== user.id) {
    redirect("/");
  }

  const isBankTransfer = order.payment_method === "bank_transfer";
  const isCash = order.payment_method === "cash";
  const isMercadoPago = order.payment_method === "mercadopago";
  const whatsappLink = generateWhatsAppLink(orderId, isBankTransfer ? "payment" : "coordination");

  const subtotal = order.total - order.shipping_cost;

  // Determine title based on order status
  const getStatusTitle = (status: string) => {
    switch (status) {
      case "pending":
        return "¡PEDIDO PENDIENTE!";
      case "confirmed":
        return "¡PEDIDO CONFIRMADO!";
      case "shipped":
        return "¡PEDIDO EN CAMINO!";
      case "delivered":
        return "¡PEDIDO ENTREGADO!";
      case "cancelled":
        return "PEDIDO CANCELADO";
      default:
        return "¡PEDIDO CONFIRMADO!";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cancelled":
        return "bg-red-100";
      case "delivered":
        return "bg-green-100";
      case "shipped":
        return "bg-purple-100";
      default:
        return "bg-green-100";
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case "cancelled":
        return "text-red-600";
      case "delivered":
        return "text-green-600";
      case "shipped":
        return "text-purple-600";
      default:
        return "text-green-600";
    }
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${getStatusIcon(order.status)} rounded-full mb-4`}>
            <CheckCircle className={`h-8 w-8 ${getStatusIconColor(order.status)}`} />
          </div>
          <h1 className="text-4xl font-bold uppercase mb-2">{getStatusTitle(order.status)}</h1>
          <p className="text-gray-600 uppercase text-sm">
            NÚMERO DE PEDIDO: <span className="font-mono font-semibold">{orderId.slice(0, 8)}</span>
          </p>
          {order.tracking_number && (
            <p className="text-gray-600 uppercase text-sm mt-2">
              TRACKING: <span className="font-mono font-semibold">{order.tracking_number}</span>
            </p>
          )}
        </div>

        {/* Payment Status Alert */}
        {order.payment_status === "pending_payment" ? (
          <Alert className="mb-6 border-2 border-yellow-500 bg-yellow-50">
            <Package className="h-5 w-5 text-yellow-600" />
            <AlertDescription>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold uppercase text-sm">PAGO PENDIENTE</span>
                <Badge className="bg-yellow-500 text-white uppercase text-xs">
                  {order.payment_status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs uppercase leading-relaxed text-gray-700 mb-3">
                TU PEDIDO SERÁ PROCESADO UNA VEZ QUE SE CONFIRME EL PAGO. TIENES 72 HORAS PARA COMPLETAR EL PAGO, LUEGO EL PEDIDO SERÁ CANCELADO AUTOMÁTICAMENTE.
              </p>
              {isMercadoPago && (
                <RetryPaymentButton orderId={orderId} />
              )}
            </AlertDescription>
          </Alert>
        ) : order.payment_status === "paid" ? (
          <Alert className="mb-6 border-2 border-green-500 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold uppercase text-sm">PAGO APROBADO</span>
                <Badge className="bg-green-600 text-white uppercase text-xs">
                  {order.payment_status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs uppercase leading-relaxed text-gray-700">
                TU PAGO HA SIDO CONFIRMADO. PRONTO PROCESAREMOS TU PEDIDO.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-2 border-red-500 bg-red-50">
            <Package className="h-5 w-5 text-red-600" />
            <AlertDescription>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold uppercase text-sm">PAGO FALLIDO</span>
                <Badge className="bg-red-600 text-white uppercase text-xs">
                  {order.payment_status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs uppercase leading-relaxed text-gray-700 mb-3">
                HUBO UN PROBLEMA CON EL PAGO. PUEDES INTENTAR NUEVAMENTE.
              </p>
              {isMercadoPago && (
                <RetryPaymentButton orderId={orderId} />
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Order Items */}
        <Card className="mb-6 border-2 border">
          <CardHeader>
            <CardTitle className="uppercase flex items-center gap-2">
              <Package className="h-5 w-5" />
              DETALLE DEL PEDIDO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 border border">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold uppercase">{item.product.name}</p>
                    <p className="text-sm text-gray-600 uppercase">
                      {item.color} / TALLE: {item.size}
                    </p>
                    <p className="text-sm">
                      ${item.price_at_purchase.toLocaleString()} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(item.price_at_purchase * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              <Separator className="bg-black" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="uppercase">SUBTOTAL</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="uppercase flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    ENVÍO
                  </span>
                  <span>
                    {order.shipping_cost === 0 ? (
                      <Badge className="bg-green-600 text-white uppercase text-xs">
                        GRATIS
                      </Badge>
                    ) : (
                      `$${order.shipping_cost.toLocaleString()}`
                    )}
                  </span>
                </div>
                <Separator className="bg-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="uppercase">TOTAL</span>
                  <span>${order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        {isMercadoPago && (
          <>
            {(order.payment_status === "paid" && order.status === "confirmed") ? (
              <Card className="mb-6 border-2 border-green-600 bg-green-50">
                <CardHeader>
                  <CardTitle className="uppercase flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    PAGO APROBADO CON MERCADOPAGO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-green-600 bg-white">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold uppercase text-sm">¡TU PAGO FUE PROCESADO EXITOSAMENTE!</p>
                      <p className="text-xs uppercase leading-relaxed">
                        TU PEDIDO HA SIDO CONFIRMADO Y ESTÁ SIENDO PROCESADO. RECIBIRÁS UNA NOTIFICACIÓN CUANDO SEA ENVIADO.
                      </p>
                      {order.mercadopago_payment_id && (
                        <p className="text-xs font-mono text-gray-600">
                          ID de Pago: {order.mercadopago_payment_id}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : order.payment_status === "failed" ? (
              <Card className="mb-6 border-2 border-red-600 bg-red-50">
                <CardHeader>
                  <CardTitle className="uppercase flex items-center gap-2 text-red-700">
                    <CreditCard className="h-5 w-5" />
                    PAGO RECHAZADO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-600 bg-white">
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold uppercase text-sm text-red-700">EL PAGO NO PUDO SER PROCESADO</p>
                      <p className="text-xs uppercase leading-relaxed">
                        HUBO UN PROBLEMA AL PROCESAR TU PAGO CON MERCADOPAGO. PUEDES INTENTAR NUEVAMENTE O ELEGIR OTRO MÉTODO DE PAGO.
                      </p>
                      {order.mercadopago_payment_id && (
                        <p className="text-xs font-mono text-gray-600">
                          ID de Pago: {order.mercadopago_payment_id}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                  <RetryPaymentButton orderId={orderId} />
                  <Link href="/checkout">
                    <Button variant="outline" className="w-full border-2 border uppercase">
                      <CreditCard className="h-4 w-4 mr-2" />
                      CAMBIAR MÉTODO DE PAGO
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-2 border-yellow-600 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="uppercase flex items-center gap-2 text-yellow-700">
                    <Package className="h-5 w-5" />
                    PAGO PENDIENTE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-yellow-600 bg-white">
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold uppercase text-sm">TU PAGO ESTÁ SIENDO PROCESADO</p>
                      <p className="text-xs uppercase leading-relaxed">
                        {mpStatus === "pending" 
                          ? "TU PAGO ESTÁ PENDIENTE DE ACREDITACIÓN. TE NOTIFICAREMOS CUANDO SE CONFIRME."
                          : "ESTAMOS ESPERANDO LA CONFIRMACIÓN DEL PAGO. ESTO PUEDE TOMAR UNOS MINUTOS."}
                      </p>
                      {order.mercadopago_payment_id && (
                        <p className="text-xs font-mono text-gray-600">
                          ID de Pago: {order.mercadopago_payment_id}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {isBankTransfer && (
          <Card className="mb-6 border-2 border">
            <CardHeader>
              <CardTitle className="uppercase">INSTRUCCIONES DE PAGO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border">
                <AlertDescription>
                  <p className="font-semibold uppercase mb-3 text-sm">TRANSFERENCIA BANCARIA</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 uppercase">CBU</span>
                      <span className="font-mono font-semibold">{BANK_INFO.cbu}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 uppercase">ALIAS</span>
                      <span className="font-mono font-semibold">{BANK_INFO.alias}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 uppercase">TITULAR</span>
                      <span className="font-semibold uppercase">{BANK_INFO.holder}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 uppercase">BANCO</span>
                      <span className="font-semibold uppercase">{BANK_INFO.bank}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-green-600 bg-green-50">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="space-y-3">
                  <p className="font-semibold uppercase text-sm">ENVÍA EL COMPROBANTE</p>
                  <p className="text-xs uppercase leading-relaxed">
                    UNA VEZ REALIZADA LA TRANSFERENCIA, ENVÍA EL COMPROBANTE POR WHATSAPP JUNTO CON TU NÚMERO DE PEDIDO.
                  </p>
                  <Link href={whatsappLink} target="_blank">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white uppercase">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      ENVIAR COMPROBANTE POR WHATSAPP
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {isCash && (
          <Card className="mb-6 border-2 border">
            <CardHeader>
              <CardTitle className="uppercase">INSTRUCCIONES DE PAGO</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-green-600 bg-green-50">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="space-y-3">
                  <p className="font-semibold uppercase text-sm">PAGO EN EFECTIVO</p>
                  <p className="text-xs uppercase leading-relaxed">
                    NOS COMUNICAREMOS CONTIGO POR WHATSAPP AL {WHATSAPP_NUMBER} PARA COORDINAR LA ENTREGA Y EL PAGO EN EFECTIVO.
                  </p>
                  <Link href={whatsappLink} target="_blank">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white uppercase">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      CONTACTAR POR WHATSAPP
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Shipping Address */}
        <Card className="mb-6 border-2 border">
          <CardHeader>
            <CardTitle className="uppercase flex items-center gap-2">
              <Truck className="h-5 w-5" />
              DIRECCIÓN DE ENVÍO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm uppercase whitespace-pre-line">{order.shipping_address}</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/account/orders" className="flex-1">
            <Button variant="outline" className="w-full border-2 border uppercase h-12">
              <Eye className="h-4 w-4 mr-2" />
              VER MIS PEDIDOS
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full bg-black text-white hover:bg-gray-800 uppercase h-12">
              <ArrowLeft className="h-4 w-4 mr-2" />
              VOLVER A LA TIENDA
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
