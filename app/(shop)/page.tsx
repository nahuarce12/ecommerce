import { ProductGrid } from "@/components/product/product-grid";
import { ProductOverlay } from "@/components/product/product-overlay";
import { products } from "@/lib/placeholder-data";

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProductGrid products={products} />
      <ProductOverlay />
    </div>
  );
}
