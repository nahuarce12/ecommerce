"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { ShoppingBag, User as UserIcon } from "lucide-react";

type Filter = "NEW" | "CLOTHES" | "ACCESSORIES" | "ORDERS";

export function Header() {
  const { toggleCart, selectedFilter, setSelectedFilter } = useUIStore();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleFilterClick = (filter: Filter) => {
    if (filter === "ORDERS") {
      window.location.href = "/orders";
    } else {
      setSelectedFilter(filter);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-sm md:text-lg tracking-tighter">
            SUPPLY
          </Link>
        </div>
        {/* Navigation Filters */}
        <nav className="flex items-center gap-4 md:gap-8 text-xs md:text-sm font-medium overflow-x-auto">
          {(["NEW", "CLOTHES", "ACCESSORIES", "ORDERS"] as Filter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={`uppercase tracking-wide transition-colors hover:text-foreground whitespace-nowrap ${
                selectedFilter === filter ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {filter === "ACCESSORIES" ? "ACCESS." : filter}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <Link href="/account" className="flex items-center gap-2 hover:opacity-70">
              <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          ) : (
            <Link href="/login" className="text-xs md:text-sm font-medium hover:underline underline-offset-4">
              LOGIN
            </Link>
          )}
          <button onClick={toggleCart} className="flex items-center gap-2 hover:opacity-70">
            <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
            {mounted && <span className="text-xs md:text-sm font-medium">{itemCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
