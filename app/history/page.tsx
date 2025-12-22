import { getHistory, getHistoryCount } from "@/actions/history"
import { HistoryPageClient } from "./HistoryPageClient"
import { Button } from "@/components/ui/button"
import { Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Watch History - Unfeed",
  description: "Your video watch history"
}

export default async function HistoryPage() {
  const [result, totalCount] = await Promise.all([
    getHistory(1),
    getHistoryCount()
  ])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Watch History</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {totalCount} {totalCount === 1 ? "video" : "videos"} watched
            </p>
          </div>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to feed
          </Button>
        </Link>
      </header>

      <HistoryPageClient
        initialEntries={result.entries}
        initialHasMore={result.hasMore}
        totalCount={totalCount}
      />
    </div>
  )
}
