import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton - matches SettingsPage header */}
      <header className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-52" />
        </div>
      </header>

      <div className="space-y-6">
        {/* Sync Status section skeleton */}
        <section className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </section>

        {/* Categories section skeleton */}
        <section className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
        </section>

        {/* Player section skeleton */}
        <section className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>
        </section>

        {/* Feed section skeleton */}
        <section>
          <Skeleton className="h-5 w-12 mb-4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </section>

        {/* Time Limits section skeleton */}
        <section className="p-4 bg-muted rounded-xl border border-border">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Data section skeleton */}
        <section>
          <Skeleton className="h-5 w-12 mb-4" />
          <Skeleton className="h-10 w-32" />
        </section>
      </div>
    </div>
  )
}
