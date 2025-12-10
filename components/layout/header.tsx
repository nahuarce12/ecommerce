"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { ShoppingBag, User as UserIcon } from "lucide-react";

export function Header() {
  const { toggleCart } = useUIStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg tracking-tighter">
            SUPPLY
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/remeras" className="hover:underline underline-offset-4">
            REMERAS
          </Link>
          <Link href="/buzos" className="hover:underline underline-offset-4">
            BUZOS
          </Link>
          <Link href="/pantalones" className="hover:underline underline-offset-4">
            PANTALONES
          </Link>
          <Link href="/accesorios" className="hover:underline underline-offset-4">
            ACCESORIOS
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/account" className="flex items-center gap-2 hover:opacity-70">
              <UserIcon className="h-5 w-5" />
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
              LOGIN
            </Link>
          )}
          <button onClick={toggleCart} className="flex items-center gap-2 hover:opacity-70">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-medium">{itemCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
