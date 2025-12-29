import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Notification list skeleton */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex gap-3 px-4 py-3 rounded-lg border border-border"
          >
            <Skeleton className="w-24 h-14 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Load more button skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}
