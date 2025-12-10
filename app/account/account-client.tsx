"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types";
import { Separator } from "@/components/ui/separator";

interface AccountClientProps {
  user: User;
  profile: Profile | null;
}

export function AccountClient({ user, profile }: AccountClientProps) {
  const router = useRouter();
  const isAdmin = profile?.role === "admin";

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

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold uppercase tracking-tight">
              {isAdmin ? "Admin Dashboard" : "My Account"}
            </h1>
            <p className="text-xs text-muted-foreground uppercase">
              Manage your profile and orders
            </p>
          </div>

          <Separator />

          {/* Profile Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase mb-4">Profile Information</h2>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground uppercase text-xs">Name:</span>
                  <span className="col-span-2">{profile?.full_name || "Not set"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground uppercase text-xs">Email:</span>
                  <span className="col-span-2">{user.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground uppercase text-xs">Role:</span>
                  <span className="col-span-2 uppercase">{profile?.role || "user"}</span>
                </div>
              </div>
            </div>

            

            <Separator />

            {/* Orders Section (Placeholder) */}
            <div>
              <h2 className="text-sm font-bold uppercase mb-4">Recent Orders</h2>
              <div className="text-center py-8 text-muted-foreground text-xs uppercase">
                No orders yet
              </div>
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
    </div>
  );
}
