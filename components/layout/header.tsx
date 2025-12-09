"use client";

import Link from "next/link";
import { useUIStore } from "@/store/ui-store";
import { ShoppingBag } from "lucide-react";

export function Header() {
  const { toggleCart } = useUIStore();

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
          <button onClick={toggleCart} className="flex items-center gap-2 hover:opacity-70">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-medium">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}
