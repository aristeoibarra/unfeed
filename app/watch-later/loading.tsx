import { Skeleton } from "@/components/ui/skeleton"
import { VideoFeedSkeleton } from "@/components/VideoFeed"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton - matches WatchLaterPage header */}
      <header className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>

      {/* Video grid skeleton */}
      <VideoFeedSkeleton count={6} />
    </div>
  )
}
