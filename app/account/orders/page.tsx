import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import Link from "next/link";

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_status,
      total,
      created_at,
      tracking_number,
      order_items (
        id,
        quantity
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-500";
      case "paid":
        return "bg-green-600";
      case "failed":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const getTotalItems = (order: any) => {
    return order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase mb-2">MIS PEDIDOS</h1>
          <p className="text-gray-600 uppercase text-sm">
            HISTORIAL DE COMPRAS
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 uppercase mb-4">NO TIENES PEDIDOS AÚN</p>
              <Link href="/">
                <Button className="bg-black text-white hover:bg-gray-800 uppercase">
                  EMPEZAR A COMPRAR
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="border-2">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm uppercase mb-1">
                        PEDIDO #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-xs text-gray-600">
                        {new Date(order.created_at).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getStatusColor(order.status)} text-white uppercase text-xs`}>
                        {order.status}
                      </Badge>
                      {/*<Badge className={`${getPaymentStatusColor(order.payment_status)} text-white uppercase text-xs`}>
                        {order.payment_status.replace("_", " ")}
                      </Badge>*/}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm space-y-1">
                      <p className="uppercase text-gray-600">
                        ITEMS: <span className="font-semibold text-black">{getTotalItems(order)}</span>
                      </p>
                      <p className="uppercase">
                        TOTAL: <span className="font-bold text-lg">${order.total.toLocaleString()}</span>
                      </p>
                      {order.tracking_number && (
                        <p className="uppercase text-gray-600">
                          TRACKING: <span className="font-mono font-semibold text-black">{order.tracking_number}</span>
                        </p>
                      )}
                    </div>
                    <Link href={`/checkout/success/${order.id}`}>
                      <Button variant="outline" className="border-2 uppercase w-full md:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        VER DETALLES
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href="/account">
            <Button variant="outline" className="border-2 uppercase">
              VOLVER A MI CUENTA
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
