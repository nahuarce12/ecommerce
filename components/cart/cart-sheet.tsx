"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";

export function CartSheet() {
  const router = useRouter();
  const { isCartOpen, toggleCart } = useUIStore();
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();

  const total = getTotal();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    toggleCart();
    router.push("/checkout");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCart}>
      <SheetContent className="w-full sm:max-w-md border-l border-border p-0 flex flex-col">
        <SheetHeader className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="uppercase text-xs md:text-sm font-bold tracking-wide">
            Shopping Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-3 md:space-y-4">
            <p className="text-muted-foreground uppercase text-xs md:text-sm">Your cart is empty</p>
            <Button variant="outline" onClick={toggleCart} className="uppercase text-[10px] md:text-xs">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3 md:gap-4">
                  <div className="relative w-16 h-16 md:w-24 md:h-24 bg-secondary/10 flex-shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1 md:p-2"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs md:text-sm font-medium uppercase">{item.product.name}</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase mt-1">
                        {item.color} / Size: {item.size}
                      </p>
                      <p className="text-xs md:text-sm font-medium mt-1">${item.product.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)
                        }
                        className="h-5 w-5 md:h-6 md:w-6 flex items-center justify-center border hover:bg-accent"
                      >
                        <Minus className="h-2 w-2 md:h-3 md:w-3" />
                      </button>
                      <span className="text-[10px] md:text-xs font-medium w-6 md:w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)
                        }
                        className="h-5 w-5 md:h-6 md:w-6 flex items-center justify-center border hover:bg-accent"
                      >
                        <Plus className="h-2 w-2 md:h-3 md:w-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id, item.size, item.color)}
                    className="self-start p-1 hover:bg-accent"
                  >
                    <X className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4 md:p-6 space-y-3 md:space-y-4 bg-background">
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="uppercase text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="uppercase text-muted-foreground">Shipping</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xs md:text-sm">
                <span className="uppercase">Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Button 
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full h-10 md:h-12 uppercase tracking-wide text-xs md:text-base bg-black text-white hover:bg-gray-800 relative"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Checkout
                {itemCount > 0 && (
                  <Badge className="ml-2 bg-white text-black px-2 py-0.5 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
