import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, ShoppingCart, DollarSign } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch statistics
  const [productsData, ordersData, lowStockData] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total"),
    supabase.from("products").select("id, name, stock").lt("stock", 5),
  ]);

  const totalProducts = productsData.count || 0;
  const orders = ordersData.data || [];
  const totalOrders = orders.length;
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const lowStockProducts = lowStockData.data || [];

  // Get orders by status
  const { data: ordersByStatus } = await supabase
    .from("orders")
    .select("status");

  const statusCounts = ordersByStatus?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground uppercase mt-1">
          Overview of your store
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground uppercase mt-1">
              Products below 5 units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase">Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <div key={status} className="text-center border p-4">
                <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
                <p className="text-xs uppercase text-muted-foreground mt-1">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="uppercase flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center border-b pb-2 last:border-0"
                >
                  <span className="text-sm uppercase">{product.name}</span>
                  <span className="text-sm font-bold text-destructive">
                    {product.stock} units
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-xs text-muted-foreground uppercase text-center pt-2">
                  + {lowStockProducts.length - 5} more products
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
