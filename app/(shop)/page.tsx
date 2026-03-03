"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductOverlay } from "@/components/product/product-overlay";
import { useUIStore } from "@/store/ui-store";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/types";

type ShopProduct = Product & {
  categories: Array<{ slug: string }>;
};

export default function ShopPage() {
  const selectedFilter = useUIStore((state) => state.selectedFilter);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, price, category_id, brand, stock, images, sizes, colors, is_active, sizes_enabled, created_at, categories(slug), product_sizes(id, product_id, size_label, stock)"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) {
        setProducts(data as ShopProduct[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Filter products based on selected filter
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedFilter === "NEW") return true;

      if (selectedFilter === "CLOTHES") {
        const categorySlug = product.categories?.[0]?.slug;
        return ["remeras", "buzos", "pantalones", "shorts", "camperas"].includes(categorySlug);
      }

      if (selectedFilter === "ACCESSORIES") {
        const categorySlug = product.categories?.[0]?.slug;
        return ["accesorios", "gorras"].includes(categorySlug);
      }

      return true;
    });
  }, [products, selectedFilter]);

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
