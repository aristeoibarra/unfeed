import { Skeleton } from "@/components/ui/skeleton"
import { VideoFeedSkeleton } from "@/components/VideoFeed"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-20 mt-1" />
      </div>

      {/* Video grid skeleton */}
      <VideoFeedSkeleton count={6} />
    </div>
  )
}
