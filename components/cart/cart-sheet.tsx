"use client";

import { useUIStore } from "@/store/ui-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

export function CartSheet() {
  const { isCartOpen, toggleCart } = useUIStore();

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCart}>
      <SheetContent className="w-full sm:max-w-md border-l border-border p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="uppercase text-sm font-bold tracking-wide">
            Shopping Cart (0)
          </SheetTitle>
          {/* Close button is handled by SheetContent default, but we can customize if needed */}
        </SheetHeader>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <p className="text-muted-foreground uppercase text-sm">Your cart is empty</p>
          <Button variant="outline" onClick={toggleCart} className="uppercase text-xs">
            Continue Shopping
          </Button>
        </div>

        <div className="border-t border-border p-6 space-y-4 bg-background">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="uppercase text-muted-foreground">Subtotal</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase text-muted-foreground">Shipping</span>
              <span className="text-xs text-muted-foreground">Calculated at checkout</span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span className="uppercase">Total</span>
            <span>$0.00</span>
          </div>
          <Button className="w-full h-12 uppercase tracking-wide text-base">
            Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
