import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <header className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
      </header>

      {/* Hero Section skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular progress skeleton */}
            <Skeleton className="w-[140px] h-[140px] rounded-full" />

            {/* Stats content skeleton */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 mx-auto sm:mx-0" />
                <Skeleton className="h-12 w-32 mx-auto sm:mx-0" />
              </div>

              {/* Quick stats row skeleton */}
              <div className="flex gap-6 justify-center sm:justify-start">
                <div className="space-y-1">
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="w-px bg-border" />
                <div className="space-y-1">
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="w-px bg-border" />
                <div className="space-y-1">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Progress skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-9 w-8" />
          </CardContent>
        </Card>
      </div>

      {/* Patterns Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-lg" />
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Channels skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity Insights skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="p-2 h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Most Rewatched skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-24 h-14 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
