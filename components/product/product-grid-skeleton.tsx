import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 9 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-4 px-2 md:px-4 bg-white">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`product-skeleton-${index}`} className="bg-white flex flex-col">
          <div className="aspect-square w-full p-4 md:p-8">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          <div className="p-2 md:p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
