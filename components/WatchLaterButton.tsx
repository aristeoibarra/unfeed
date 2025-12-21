"use client"

import { toggleWatchLater } from "@/actions/watch-later"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface WatchLaterButtonProps {
  video: {
    videoId: string
    title: string
    thumbnail: string
    channelId: string
    channelName: string
  }
  isInWatchLater: boolean
  variant?: "icon" | "button"
}

export function WatchLaterButton({ video, isInWatchLater: initial, variant = "button" }: WatchLaterButtonProps) {
  const router = useRouter()
  const [isInWatchLater, setIsInWatchLater] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    const newState = await toggleWatchLater(video)
    setIsInWatchLater(newState)
    router.refresh()
    setLoading(false)
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`p-2 rounded-full transition-colors ${
          isInWatchLater
            ? "bg-blue-600 text-white"
            : "bg-black/50 text-white hover:bg-black/70"
        } disabled:opacity-50`}
        title={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
        isInWatchLater
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
      } disabled:opacity-50`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
          clipRule="evenodd"
        />
      </svg>
      {loading ? "..." : isInWatchLater ? "Saved" : "Watch Later"}
    </button>
  )
}
