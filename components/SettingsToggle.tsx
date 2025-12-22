"use client"

import { useState } from "react"
import { toggleHideDislikedFromFeed } from "@/actions/settings"

interface SettingsToggleProps {
  initialHideDisliked: boolean
}

export function SettingsToggle({ initialHideDisliked }: SettingsToggleProps) {
  const [hideDisliked, setHideDisliked] = useState(initialHideDisliked)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    setHideDisliked(!hideDisliked)

    const newValue = await toggleHideDislikedFromFeed()
    setHideDisliked(newValue)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div>
        <h3 className="font-medium">Hide disliked videos from feed</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Videos you dislike won't appear in your main feed
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
          hideDisliked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        }`}
        role="switch"
        aria-checked={hideDisliked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            hideDisliked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
