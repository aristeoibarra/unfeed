"use client"

import { useState } from "react"
import { syncVideos } from "@/actions/sync"

interface SyncButtonProps {
  lastSyncedAt: Date | null
  cachedVideoCount: number
}

export function SyncButton({ lastSyncedAt, cachedVideoCount }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setMessage(null)

    const result = await syncVideos()

    setMessage(result.message)
    setSyncing(false)

    if (result.success) {
      // Refresh the page to show new videos
      window.location.reload()
    }
  }

  const formatLastSync = () => {
    if (!lastSyncedAt) return "Never synced"

    const now = new Date()
    const diff = now.getTime() - new Date(lastSyncedAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? "s" : ""} ago`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`
    }
    return `${minutes}m ago`
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <span>{cachedVideoCount} videos cached</span>
        <span className="mx-2">·</span>
        <span>Last sync: {formatLastSync()}</span>
      </div>

      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {syncing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Now
          </>
        )}
      </button>

      {message && (
        <span className={`text-sm ${message.includes("failed") || message.includes("exceeded") ? "text-red-500" : "text-green-500"}`}>
          {message}
        </span>
      )}
    </div>
  )
}
