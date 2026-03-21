"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, ShoppingBag, User as UserIcon, X } from "lucide-react";

type Filter = "NEW" | "CLOTHES" | "ACCESSORIES";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleCart, selectedFilter, setSelectedFilter } = useUIStore();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const filters: Filter[] = ["NEW", "CLOTHES", "ACCESSORIES"];
  const filterLabels: Record<Filter, string> = {
    NEW: "NUEVO",
    CLOTHES: "ROPA",
    ACCESSORIES: "ACCES.",
  };

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
    setIsMobileFiltersOpen(false);

    // Redirect to home and set filter
    setSelectedFilter(filter);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-sm md:text-lg tracking-tighter">
            SUPPLY WORLD
          </Link>
        </div>
        {/* Navigation Filters */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium overflow-x-auto">
          {filters.map((filter) => {
            const isActive = selectedFilter === filter && pathname === "/";
            return (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={`uppercase tracking-wide transition-colors hover:text-foreground whitespace-nowrap ${
                  isActive ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {filterLabels[filter]}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <Link href="/account" className="flex items-center gap-2 hover:opacity-70">
              <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          ) : (
            <Link href="/login" className="text-xs md:text-sm font-medium hover:underline underline-offset-4">
              INGRESAR
            </Link>
          )}
          <button onClick={toggleCart} className="flex items-center gap-2 hover:opacity-70">
            <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
            {mounted && <span className="text-xs md:text-sm font-medium">{itemCount}</span>}
          </button>
          <button
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
            className="md:hidden hover:opacity-70"
            aria-label={isMobileFiltersOpen ? "Cerrar filtros" : "Abrir filtros"}
            aria-expanded={isMobileFiltersOpen}
            aria-controls="mobile-header-filters"
          >
            {isMobileFiltersOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div id="mobile-header-filters" className="border-t border-border px-4 pb-3 pt-2 md:hidden">
          <nav className="flex items-center gap-4 text-xs font-medium overflow-x-auto">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter && pathname === "/";
              return (
                <button
                  key={filter}
                  onClick={() => handleFilterClick(filter)}
                  className={`uppercase tracking-wide transition-colors hover:text-foreground whitespace-nowrap ${
                    isActive ? "text-foreground font-bold" : "text-muted-foreground"
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
