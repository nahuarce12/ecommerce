"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductOverlay } from "@/components/product/product-overlay";
import { products } from "@/lib/placeholder-data";
import { useUIStore } from "@/store/ui-store";

export default function ShopPage() {
  const selectedFilter = useUIStore((state) => state.selectedFilter);

  // Filter products based on selected filter
  const filteredProducts = products.filter((product) => {
    if (selectedFilter === "NEW") return true;
    if (selectedFilter === "CLOTHES") {
      return ["remeras", "buzos", "pantalones", "shorts", "camperas"].includes(product.category_id);
    }
    if (selectedFilter === "ACCESSORIES") {
      return ["accesorios", "gorras"].includes(product.category_id);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedFilter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ProductGrid products={filteredProducts} />
        </motion.div>
      </AnimatePresence>
      <ProductOverlay />
    </div>
  );
}
