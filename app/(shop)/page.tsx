"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductOverlay } from "@/components/product/product-overlay";
import { useUIStore } from "@/store/ui-store";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/types";

export default function ShopPage() {
  const selectedFilter = useUIStore((state) => state.selectedFilter);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, categories(slug)")
        .order("created_at", { ascending: false });

      if (data) {
        setProducts(data as any);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Filter products based on selected filter
  const filteredProducts = products.filter((product) => {
    if (selectedFilter === "NEW") return true;
    
    if (selectedFilter === "CLOTHES") {
      const categorySlug = (product as any).categories?.slug;
      return ["remeras", "buzos", "pantalones", "shorts", "camperas"].includes(categorySlug);
    }
    
    if (selectedFilter === "ACCESSORIES") {
      const categorySlug = (product as any).categories?.slug;
      return ["accesorios", "gorras"].includes(categorySlug);
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm uppercase text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm uppercase text-muted-foreground">No products available</p>
          <p className="text-xs text-muted-foreground">Add products through the admin dashboard</p>
        </div>
      </div>
    );
  }

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
