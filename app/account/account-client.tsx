"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ProfileEditForm } from "@/components/account/profile-edit-form";

interface AccountClientProps {
  user: User;
  profile: Profile | null;
}

interface RecentOrder {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  tracking_number: string | null;
}

export function AccountClient({ user, profile: initialProfile }: AccountClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const loadOrders = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select(`
          id, 
          status, 
          payment_status, 
          total, 
          created_at,
          tracking_number,
          order_items(quantity)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (data) {
        // Calculate total items for each order
        const ordersWithItemCount = data.map(order => ({
          ...order,
          itemCount: (order.order_items as any[])?.reduce((sum, item) => sum + item.quantity, 0) || 0
        }));
        setOrders(ordersWithItemCount as any);
      }
      setLoadingOrders(false);
    };

    loadOrders();
  }, [user.id]);

  useEffect(() => {
    if (isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isAdmin) {
    return null; // Don't render anything while redirecting
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xs uppercase text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold uppercase tracking-tight">
              Mi Cuenta
            </h1>
            <p className="text-xs text-muted-foreground uppercase">
              Gestioná tu perfil y pedidos
            </p>
          </div>

          <Separator />

          {/* Orders Section (Placeholder) */}
          <div>
            <h2 className="text-sm font-bold uppercase mb-4">Recent Orders</h2>
            {loadingOrders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse border border-border" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs uppercase">
                No orders yet
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="border-2 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-mono font-semibold">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("es-AR")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(order as any).itemCount} {(order as any).itemCount === 1 ? 'item' : 'items'}
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Tracking: {order.tracking_number}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Badge className={`uppercase text-xs ${
                          order.status === 'pending' ? 'bg-yellow-500' :
                          order.status === 'confirmed' ? 'bg-blue-500' :
                          order.status === 'shipped' ? 'bg-purple-500' :
                          order.status === 'delivered' ? 'bg-green-600' : 'bg-red-600'
                        } text-white`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold">${order.total.toLocaleString()}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="uppercase text-xs border-2"
                        onClick={() => router.push(`/checkout/success/${order.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full uppercase text-xs border"
                  onClick={() => router.push('/account/orders')}
                >
                  Ver Todas Las Órdenes
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Profile Edit Form */}
          <div>
            <ProfileEditForm profile={profile} onUpdate={setProfile} />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="uppercase text-xs"
              onClick={() => router.push("/")}
            >
              Back to Shop
            </Button>
            <Button
              variant="destructive"
              className="uppercase text-xs"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
