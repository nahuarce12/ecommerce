"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format-money";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  total: number;
  shipping_cost: number;
  shipping_address: string;
  payment_method: string;
  tracking_number: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null; id: string } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
}

type BaseOrderRow = Omit<Order, "profiles">;
type ProfileRow = { id: string; full_name: string | null; phone: string | null };

interface CustomerContact {
  phone: string | null;
  email: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderContact, setSelectedOrderContact] = useState<CustomerContact | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const trackingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateOrderInState = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order)));
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const fetchOrders = async (filter: string) => {
    const supabase = createClient();
    
    // First check if user is authenticated and admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      setLoading(false);
      return;
    }

    // Get orders
    let ordersQuery = supabase
      .from("orders")
      .select("id, user_id, status, payment_status, total, shipping_cost, shipping_address, payment_method, tracking_number, created_at")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      ordersQuery = ordersQuery.eq("status", filter);
    }

    const { data, error } = await ordersQuery;

    if (error) {
      console.error("Error fetching orders:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
    
    if (data) {
      // Get profiles for each unique user_id
      const userIds = [...new Set(data.map(order => order.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);

      const profilesMap = new Map((profilesData as ProfileRow[] | null)?.map((profile) => [profile.id, profile]) ?? []);
      
      // Merge profiles into orders
      const ordersWithProfiles = (data as BaseOrderRow[]).map((order) => ({
        ...order,
        profiles: profilesMap.has(order.user_id)
          ? {
            id: order.user_id,
            full_name: profilesMap.get(order.user_id)?.full_name ?? null,
            phone: profilesMap.get(order.user_id)?.phone ?? null,
          }
          : null,
      }));

      setOrders(ordersWithProfiles);
    }
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("order_items")
      .select("id, product_name, size, color, quantity, price_at_purchase")
      .eq("order_id", orderId);

    if (data) setOrderItems(data);
  };

  const fetchOrderContact = async (orderId: string) => {
    setLoadingContact(true);

    try {
      const res = await fetch("/api/admin/orders/customer-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSelectedOrderContact(null);
        toast.error(result?.error || "NO SE PUDO OBTENER CONTACTO DEL CLIENTE");
        return;
      }

      setSelectedOrderContact({
        phone: result?.contact?.phone ?? null,
        email: result?.contact?.email ?? null,
      });
    } catch {
      setSelectedOrderContact(null);
      toast.error("ERROR AL OBTENER CONTACTO DEL CLIENTE");
    } finally {
      setLoadingContact(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setSelectedOrderContact({
      phone: order.profiles?.phone ?? null,
      email: null,
    });
    await Promise.all([fetchOrderItems(order.id), fetchOrderContact(order.id)]);
    setDialogOpen(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);

    const res = await fetch("/api/admin/orders/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, newStatus }),
    });

    const result = await res.json();

    setUpdatingStatus(false);

    if (!res.ok) {
      toast.error(result?.error || "ERROR AL ACTUALIZAR ESTADO");
    } else {
      updateOrderInState(orderId, { status: newStatus });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success("ESTADO DE ORDEN ACTUALIZADO");
    }
  };

  const handleTrackingUpdate = useCallback((orderId: string, trackingNumber: string) => {
    setTrackingError("");

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, tracking_number: trackingNumber });
    }

    if (trackingDebounceRef.current) {
      clearTimeout(trackingDebounceRef.current);
    }

    trackingDebounceRef.current = setTimeout(async () => {
      const res = await fetch("/api/admin/orders/update-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, trackingNumber }),
      });

      const result = await res.json();

      if (!res.ok) {
        const errorMessage = result?.error || "ERROR AL ACTUALIZAR TRACKING";
        setTrackingError(errorMessage);
        toast.error(errorMessage);
      } else {
        updateOrderInState(orderId, { tracking_number: trackingNumber });
      }
    }, 800);
  }, [selectedOrder, updateOrderInState]);

  const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: string) => {
    setUpdatingPayment(true);

    const res = await fetch("/api/admin/orders/update-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, newPaymentStatus }),
    });

    const result = await res.json();
    setUpdatingPayment(false);

    if (!res.ok) {
      toast.error(result?.error || "ERROR AL ACTUALIZAR ESTADO DE PAGO");
    } else {
      updateOrderInState(orderId, { payment_status: newPaymentStatus });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newPaymentStatus });
      }
      toast.success("ESTADO DE PAGO ACTUALIZADO");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "";
    }
  };

  const filteredOrders = orders;

  if (loading) {
    return <div className="text-center py-12 uppercase">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground uppercase mt-1">
            Manage customer orders
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] uppercase">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="uppercase">All Orders</SelectItem>
            <SelectItem value="pending" className="uppercase">Pending</SelectItem>
            <SelectItem value="confirmed" className="uppercase">Confirmed</SelectItem>
            <SelectItem value="shipped" className="uppercase">Shipped</SelectItem>
            <SelectItem value="delivered" className="uppercase">Delivered</SelectItem>
            <SelectItem value="cancelled" className="uppercase">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase">Order ID</TableHead>
              <TableHead className="uppercase">Customer</TableHead>
              <TableHead className="uppercase">Status</TableHead>
              <TableHead className="uppercase">Total</TableHead>
              <TableHead className="uppercase">Tracking</TableHead>
              <TableHead className="uppercase">Date</TableHead>
              <TableHead className="uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleViewOrder(order)}>
                <TableCell className="font-mono text-xs">
                  {order.id.substring(0, 8)}...
                </TableCell>
                <TableCell className="uppercase text-xs">
                  {order.profiles?.full_name || "Unknown"}
                </TableCell>
                <TableCell>
                  <Badge className={`uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">${formatMoney(order.total)}</TableCell>
                <TableCell className="text-xs font-mono">
                  {order.tracking_number || "-"}
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOrder(order);
                    }}
                    className="uppercase"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground uppercase text-sm">
            No orders found
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">Order Details</DialogTitle>
            <DialogDescription className="uppercase text-xs font-mono">
              Order ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="border p-4 space-y-2">
                <h3 className="font-bold uppercase text-sm">Customer Information</h3>
                <p className="text-xs uppercase">
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {selectedOrder.profiles?.full_name || "Unknown"}
                </p>
                <p className="text-xs uppercase">
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {selectedOrderContact?.phone || "N/A"}
                </p>
                <p className="text-xs">
                  <span className="text-muted-foreground uppercase">Email:</span>{" "}
                  {loadingContact ? "CARGANDO..." : (selectedOrderContact?.email || "N/A")}
                </p>
                <p className="text-xs">
                  <span className="text-muted-foreground uppercase">Shipping Address:</span>{" "}
                  {selectedOrder.shipping_address}
                </p>
                <p className="text-xs uppercase">
                  <span className="text-muted-foreground">Payment Method:</span>{" "}
                  {selectedOrder.payment_method || "N/A"}
                </p>
              </div>

              {/* Order Status */}
              <div className="border p-4 space-y-3">
                <h3 className="font-bold uppercase text-sm">Order Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs uppercase font-medium block mb-2">
                      Order Status
                    </label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending" className="uppercase">Pending</SelectItem>
                        <SelectItem value="confirmed" className="uppercase">Confirmed</SelectItem>
                        <SelectItem value="shipped" className="uppercase">Shipped</SelectItem>
                        <SelectItem value="delivered" className="uppercase">Delivered</SelectItem>
                        <SelectItem value="cancelled" className="uppercase">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs uppercase font-medium block mb-2">
                      Payment Status
                    </label>
                    <Select
                      value={selectedOrder.payment_status}
                      onValueChange={(val) => handlePaymentStatusUpdate(selectedOrder.id, val)}
                      disabled={updatingPayment}
                    >
                      <SelectTrigger className="uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_payment" className="uppercase">Pending</SelectItem>
                        <SelectItem value="paid" className="uppercase">Paid</SelectItem>
                        <SelectItem value="failed" className="uppercase">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs uppercase font-medium block mb-2">
                      Tracking Number
                    </label>
                    <Input
                      value={selectedOrder.tracking_number || ""}
                      onChange={(e) => handleTrackingUpdate(selectedOrder.id, e.target.value)}
                      placeholder="Enter tracking number"
                      className={`font-mono ${trackingError ? "border-red-500" : ""}`}
                    />
                    {trackingError && (
                      <p className="text-xs text-red-600 mt-1 uppercase">{trackingError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border p-4 space-y-3">
                <h3 className="font-bold uppercase text-sm">Order Items</h3>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start border-b pb-2 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm uppercase font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground uppercase">
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          ${formatMoney(item.price_at_purchase * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${formatMoney(item.price_at_purchase)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-3">
                  <span className="font-bold uppercase">Total</span>
                  <span className="text-xl font-bold">${formatMoney(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
