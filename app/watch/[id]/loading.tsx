import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WatchLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button skeleton */}
      <Skeleton className="h-8 w-32" />

      {/* Video player skeleton */}
      <div className="space-y-6">
        <Skeleton className="aspect-video w-full rounded-xl" />

        {/* Video info skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
        </div>
      </div>

      {/* Notes section skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
