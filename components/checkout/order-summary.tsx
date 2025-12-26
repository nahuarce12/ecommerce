"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { calculateShipping } from "@/lib/shipping-calculator";
import { Truck } from "lucide-react";
import Image from "next/image";

interface OrderSummaryProps {
  city: string;
  province: string;
}

export function OrderSummary({ city, province }: OrderSummaryProps) {
  const { items, getTotal } = useCartStore();
  
  const subtotal = getTotal();
  const shipping = city && province ? calculateShipping(city, province) : null;
  const total = subtotal + (shipping?.cost || 0);

  return (
    <Card className="border-2 border">
      <CardHeader>
        <CardTitle className="uppercase">RESUMEN DEL PEDIDO</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.size}-${item.color}`}
              className="flex gap-3"
            >
              <div className="relative w-16 h-16 flex-shrink-0 border border">
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium uppercase truncate">{item.product.name}</p>
                <p className="text-xs text-gray-600 uppercase">
                  {item.color} / TALLE: {item.size}
                </p>
                <p className="text-xs">
                  ${item.product.price.toLocaleString()} x {item.quantity}
                </p>
              </div>
              <div className="text-sm font-medium">
                ${(item.product.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-black" />

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="uppercase">SUBTOTAL</span>
          <span className="font-medium">${subtotal.toLocaleString()}</span>
        </div>

        {/* Shipping */}
        {shipping ? (
          <div>
            <div className="flex justify-between text-sm items-center">
              <span className="uppercase flex items-center gap-2">
                <Truck className="h-4 w-4" />
                ENVÍO
              </span>
              <span className="font-medium">
                {shipping.isFree ? (
                  <Badge className="bg-green-600 text-white uppercase">
                    GRATIS
                  </Badge>
                ) : (
                  `$${shipping.cost.toLocaleString()}`
                )}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 uppercase">
              {shipping.description}
            </p>
          </div>
        ) : (
          <div className="flex justify-between text-sm text-gray-500">
            <span className="uppercase">ENVÍO</span>
            <span className="uppercase text-xs">A CALCULAR</span>
          </div>
        )}

        <Separator className="bg-black" />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold">
          <span className="uppercase">TOTAL</span>
          <span>${total.toLocaleString()}</span>
        </div>

        {shipping && shipping.isFree && (
          <Badge className="w-full justify-center bg-green-600 text-white uppercase text-xs py-2">
            <Truck className="h-3 w-3 mr-2" />
            ENVÍO GRATIS A {shipping.zone}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
