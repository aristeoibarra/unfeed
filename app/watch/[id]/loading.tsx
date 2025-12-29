import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WatchLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* VideoPlayer skeleton - matches VideoPlayer component structure */}
      <article className="space-y-6">
        {/* Video player container */}
        <Skeleton className="aspect-video w-full rounded-xl" />

        {/* Video info section */}
        <div className="space-y-4">
          {/* Title */}
          <Skeleton className="h-7 md:h-8 w-3/4" />

          {/* Channel and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Channel name */}
            <Skeleton className="h-5 w-32" />

            {/* Action buttons: LikeDislike + AddToPlaylist + WatchLater */}
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* AudioModeToggle section */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </article>

      {/* Notes section skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
