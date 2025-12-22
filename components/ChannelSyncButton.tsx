"use client"

import { useState } from "react"
import { syncSingleChannel } from "@/actions/sync"

interface ChannelSyncButtonProps {
  channelId: string
  videoCount: number
}

export function ChannelSyncButton({ channelId, videoCount }: ChannelSyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setMessage(null)

    const result = await syncSingleChannel(channelId)

    setMessage(result.message)
    setSyncing(false)

    if (result.success) {
      window.location.reload()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {videoCount} videos cached
      </span>

      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {syncing ? (
          <>
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Syncing...
          </>
        ) : (
          "Sync Channel"
        )}
      </button>

      {message && (
        <span className={`text-sm ${message.includes("failed") ? "text-red-500" : "text-green-500"}`}>
          {message}
        </span>
      )}
    </div>
  )
}
