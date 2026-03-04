import { Skeleton } from "@/components/ui/skeleton";
import { RecentOrdersSkeleton } from "@/components/account/recent-orders-skeleton";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>

          <Skeleton className="h-px w-full" />

          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <RecentOrdersSkeleton />
          </div>

          <Skeleton className="h-px w-full" />

          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-48 w-full" />
          </div>

          <Skeleton className="h-px w-full" />

          <div className="flex gap-4">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
