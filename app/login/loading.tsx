import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <main className="w-full max-w-sm">
        {/* Logo and title skeleton */}
        <header className="text-center mb-10">
          <Skeleton className="mx-auto w-16 h-16 mb-6 rounded-2xl" />
          <Skeleton className="h-9 w-24 mx-auto" />
          <Skeleton className="h-5 w-40 mx-auto mt-2" />
        </header>

        {/* Login form card skeleton */}
        <div className="bg-[var(--card)] rounded-2xl p-6 md:p-8 shadow-sm ring-1 ring-[var(--border)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Footer skeleton */}
        <footer className="mt-8 text-center">
          <Skeleton className="h-3 w-24 mx-auto" />
        </footer>
      </main>
    </div>
  )
}
