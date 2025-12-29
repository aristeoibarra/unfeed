import { VideoFeedSkeleton } from "@/components/VideoFeed"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Filters section skeleton - matches HomeFilters + SubscriptionFilter */}
      <section aria-label="Loading filters" className="space-y-4">
        {/* HomeFilters: Search + Sort dropdown + Unwatched toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* SubscriptionFilter: Channel filter button */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
        </div>
      </section>

      {/* Video grid skeleton */}
      <VideoFeedSkeleton count={6} />
    </div>
  )
}
