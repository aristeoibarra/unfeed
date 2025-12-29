import { Skeleton } from "@/components/ui/skeleton"
import { VideoFeedSkeleton } from "@/components/VideoFeed"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Subscription header skeleton - matches SubscriptionHeader */}
      <div className="flex items-center gap-4 pb-6 border-b border-border">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Video feed skeleton */}
      <VideoFeedSkeleton count={6} />
    </div>
  )
}
