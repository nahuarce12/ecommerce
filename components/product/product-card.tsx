"use client";

import Image from "next/image";
import { Product } from "@/types";
import { useUIStore } from "@/store/ui-store";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { setSelectedProduct } = useUIStore();

  return (
    <div 
      className="group cursor-pointer bg-white flex flex-col"
      onClick={() => setSelectedProduct(product)}
    >
      <div className="relative aspect-square w-full bg-white flex items-center justify-center p-8 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </div>
      </div>
      <div className="p-4 text-center bg-white">
        <h3 className="text-xs font-medium uppercase tracking-wide">{product.name}</h3>
      </div>
    </div>
  );
}
