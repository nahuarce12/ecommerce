import { Skeleton } from "@/components/ui/skeleton";

interface RecentOrdersSkeletonProps {
  count?: number;
}

export function RecentOrdersSkeleton({ count = 3 }: RecentOrdersSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`recent-order-skeleton-${index}`} className="border-2 p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 w-full max-w-[220px]">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
