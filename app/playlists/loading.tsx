import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton - matches PlaylistsPage header */}
      <header className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </header>

      {/* Create playlist form skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Playlists grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex gap-3">
              {/* Thumbnail grid */}
              <div className="w-32 h-20 grid grid-cols-2 grid-rows-2 gap-0.5 rounded overflow-hidden">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="w-full h-full rounded-none" />
                ))}
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
