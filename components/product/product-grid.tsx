"use client";

import { Product } from "@/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    /* 🎨 CUSTOMIZE GRID SIZE HERE: 
       - Change grid-cols-X to adjust columns (current: 3-4 columns on desktop)
       - Change gap-X to adjust spacing between cards
       - Current setup makes cards smaller/more compact
    */
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-4 px-2 md:px-4 bg-white">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
