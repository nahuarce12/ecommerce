"use client";

import { useState, useEffect } from "react";
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

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping_address: string;
  payment_method: string;
  tracking_number: string | null;
  created_at: string;
  profiles: { full_name: string | null; id: string } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name, id)")
      .order("created_at", { ascending: false });

    if (data) setOrders(data as any);
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (data) setOrderItems(data);
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setDialogOpen(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    setUpdatingStatus(false);

    if (error) {
      alert("Failed to update status");
      console.error(error);
    } else {
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const handleTrackingUpdate = async (orderId: string, trackingNumber: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      alert("Failed to update tracking number");
      console.error(error);
    } else {
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, tracking_number: trackingNumber });
      }
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

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

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
      <div className="border">
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
                <TableCell className="text-xs">${order.total.toFixed(2)}</TableCell>
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
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs uppercase font-medium block mb-2">
                      Status
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
                  <div className="flex-1">
                    <label className="text-xs uppercase font-medium block mb-2">
                      Tracking Number
                    </label>
                    <Input
                      value={selectedOrder.tracking_number || ""}
                      onChange={(e) => handleTrackingUpdate(selectedOrder.id, e.target.value)}
                      placeholder="Enter tracking number"
                      className="font-mono"
                    />
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
                          ${(item.price_at_purchase * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price_at_purchase.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-3">
                  <span className="font-bold uppercase">Total</span>
                  <span className="text-xl font-bold">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
