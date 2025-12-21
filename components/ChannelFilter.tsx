"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface Channel {
  id: number
  channelId: string
  name: string
  thumbnail: string | null
}

interface ChannelFilterProps {
  channels: Channel[]
}

export function ChannelFilter({ channels }: ChannelFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get("channel")

  function handleFilter(channelId: string | null) {
    const params = new URLSearchParams(searchParams.toString())

    if (channelId) {
      params.set("channel", channelId)
    } else {
      params.delete("channel")
    }

    router.push(`/?${params.toString()}`)
  }

  if (channels.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleFilter(null)}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          !currentFilter
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        All
      </button>
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => handleFilter(channel.channelId)}
          className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
            currentFilter === channel.channelId
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt=""
              className="w-4 h-4 rounded-full"
            />
          )}
          {channel.name}
        </button>
      ))}
    </div>
  )
}
