"use client"

import { deleteChannel } from "@/actions/channels"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Channel {
  id: number
  channelId: string
  name: string
  thumbnail: string | null
}

interface ChannelListProps {
  channels: Channel[]
}

export function ChannelList({ channels }: ChannelListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleDelete(id: number) {
    setDeletingId(id)
    await deleteChannel(id)
    router.refresh()
    setDeletingId(null)
  }

  if (channels.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No channels added yet. Add your first channel above.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {channels.map((channel) => (
        <li
          key={channel.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {channel.thumbnail && (
              <img
                src={channel.thumbnail}
                alt={channel.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <span className="font-medium">{channel.name}</span>
          </div>
          <button
            onClick={() => handleDelete(channel.id)}
            disabled={deletingId === channel.id}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
          >
            {deletingId === channel.id ? "Removing..." : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  )
}
