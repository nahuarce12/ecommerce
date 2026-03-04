import { Skeleton } from "@/components/ui/skeleton";

export default function AccountOrdersLoading() {
  return (
    <div className="min-h-screen bg-white pt-20 md:pt-32 pb-12 md:pb-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`order-card-skeleton-${index}`} className="border-2 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-10 w-full md:w-40" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    </div>
  );
}
