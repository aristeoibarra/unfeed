import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton - matches HistoryPage header */}
      <header className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </header>

      {/* History list skeleton - grouped by time */}
      <div className="space-y-6">
        {/* Today section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-16" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg">
              <Skeleton className="w-32 h-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Yesterday section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg">
              <Skeleton className="w-32 h-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
