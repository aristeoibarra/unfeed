import { getHistory, getHistoryCount } from "@/actions/history"
import { HistoryPageClient } from "./HistoryPageClient"
import { Clock } from "lucide-react"

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
      <header className="flex items-center gap-4">
        <div className="p-3 bg-info/20 rounded-xl">
          <Clock className="h-6 w-6 text-info" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watch History</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} {totalCount === 1 ? "video" : "videos"} watched
          </p>
        </div>
      </header>

      <HistoryPageClient
        initialEntries={result.entries}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
