import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white">
      <ProductGridSkeleton />
    </div>
  );
}
