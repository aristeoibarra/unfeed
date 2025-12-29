"use client"

import { useState } from "react"
import { HistoryList } from "@/components/HistoryList"
import { getHistory, searchHistory, type HistoryEntry } from "@/actions/history"

interface HistoryPageClientProps {
  initialEntries: HistoryEntry[]
  initialHasMore: boolean
}

export function HistoryPageClient({
  initialEntries,
  initialHasMore
}: HistoryPageClientProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) {
      // Reset to initial state
      const result = await getHistory(1)
      setEntries(result.entries)
      setHasMore(result.hasMore)
      setPage(1)
      return
    }

    setSearching(true)
    const results = await searchHistory(search.trim())
    setEntries(results)
    setHasMore(false)
    setSearching(false)
  }

  async function handleLoadMore() {
    const nextPage = page + 1
    const result = await getHistory(nextPage, search || undefined)
    setPage(nextPage)
    return result
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history..."
          className="flex-1 px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
      </form>

      <HistoryList
        initialEntries={entries}
        initialHasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}
