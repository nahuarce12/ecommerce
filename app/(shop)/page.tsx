"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductOverlay } from "@/components/product/product-overlay";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { useUIStore } from "@/store/ui-store";
import { createClient } from "@/lib/supabase/client";
import { Product, SizeMeasurementField } from "@/types";

type ShopProduct = Product & {
  categories: { slug: string; size_measure_schema?: SizeMeasurementField[] | null; size_guide_image_url?: string | null } | Array<{ slug: string; size_measure_schema?: SizeMeasurementField[] | null; size_guide_image_url?: string | null }> | null;
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
        .select("*, categories(slug, size_measure_schema, size_guide_image_url), product_sizes(*)")
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
    const getCategorySlug = (product: ShopProduct) => {
      const categoryData = product.categories;
      if (!categoryData) return undefined;
      return Array.isArray(categoryData) ? categoryData[0]?.slug : categoryData.slug;
    };

    return products.filter((product) => {
      if (selectedFilter === "NEW") return true;

      if (selectedFilter === "CLOTHES") {
        const categorySlug = getCategorySlug(product);
        if (!categorySlug) return false;
        return ["remeras", "buzos", "pantalones", "shorts", "camperas"].includes(categorySlug);
      }

      if (selectedFilter === "ACCESSORIES") {
        const categorySlug = getCategorySlug(product);
        if (!categorySlug) return false;
        return ["accesorios", "gorras"].includes(categorySlug);
      }

      return true;
    });
  }, [products, selectedFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ProductGridSkeleton />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm uppercase text-muted-foreground">No hay productos disponibles</p>
          <p className="text-xs text-muted-foreground">Agregá productos desde el panel de administración</p>
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
