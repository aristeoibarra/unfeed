"use client"

import { toggleWatched } from "@/actions/watched"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface WatchedButtonProps {
  videoId: string
  isWatched: boolean
}

export function WatchedButton({ videoId, isWatched: initialWatched }: WatchedButtonProps) {
  const router = useRouter()
  const [isWatched, setIsWatched] = useState(initialWatched)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const newState = await toggleWatched(videoId)
    setIsWatched(newState)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
        isWatched
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
      } disabled:opacity-50`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
      >
        {isWatched ? (
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        ) : (
          <>
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path
              fillRule="evenodd"
              d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </>
        )}
      </svg>
      {loading ? "..." : isWatched ? "Watched" : "Mark watched"}
    </button>
  )
}
