"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ProfileEditForm } from "@/components/account/profile-edit-form";

interface AccountClientProps {
  user: User;
  profile: Profile | null;
}

export function AccountClient({ user, profile: initialProfile }: AccountClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse" />
              <div className="h-4 w-64 bg-muted animate-pulse" />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="h-12 w-full border bg-muted/10 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

          {/* Profile Edit Form */}
          <div>
            <ProfileEditForm profile={profile} onUpdate={setProfile} />
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
  );
}
