"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { removeFromPlaylist, reorderPlaylistVideo, type PlaylistVideoData } from "@/actions/playlists"

interface PlaylistVideoListProps {
  playlistId: number
  initialVideos: PlaylistVideoData[]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function PlaylistVideoList({ playlistId, initialVideos }: PlaylistVideoListProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(videoId: string) {
    setRemovingId(videoId)
    const result = await removeFromPlaylist(playlistId, videoId)

    if (result.success) {
      setVideos(videos.filter(v => v.videoId !== videoId))
    }

    setRemovingId(null)
  }

  async function handleMoveUp(videoId: string, currentPosition: number) {
    if (currentPosition === 0) return

    await reorderPlaylistVideo(playlistId, videoId, currentPosition - 1)

    // Update local state
    const newVideos = [...videos]
    const idx = newVideos.findIndex(v => v.videoId === videoId)
    if (idx > 0) {
      const temp = newVideos[idx]
      newVideos[idx] = newVideos[idx - 1]
      newVideos[idx - 1] = temp
      // Update positions
      newVideos[idx].position = idx
      newVideos[idx - 1].position = idx - 1
    }
    setVideos(newVideos)
  }

  async function handleMoveDown(videoId: string, currentPosition: number) {
    if (currentPosition === videos.length - 1) return

    await reorderPlaylistVideo(playlistId, videoId, currentPosition + 1)

    // Update local state
    const newVideos = [...videos]
    const idx = newVideos.findIndex(v => v.videoId === videoId)
    if (idx < newVideos.length - 1) {
      const temp = newVideos[idx]
      newVideos[idx] = newVideos[idx + 1]
      newVideos[idx + 1] = temp
      // Update positions
      newVideos[idx].position = idx
      newVideos[idx + 1].position = idx + 1
    }
    setVideos(newVideos)
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          No videos in this playlist.
        </p>
        <p className="text-sm text-gray-500">
          Add videos from the video player.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          {/* Position */}
          <span className="w-6 text-center text-sm text-gray-500">
            {index + 1}
          </span>

          {/* Thumbnail */}
          <Link href={`/watch/${video.videoId}`} className="relative w-24 aspect-video flex-shrink-0">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover rounded"
              sizes="96px"
            />
            {video.duration && (
              <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                {formatDuration(video.duration)}
              </div>
            )}
          </Link>

          {/* Info */}
          <Link href={`/watch/${video.videoId}`} className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400">
              {video.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {video.channelName}
            </p>
          </Link>

          {/* Reorder buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleMoveUp(video.videoId, index)}
              disabled={index === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              onClick={() => handleMoveDown(video.videoId, index)}
              disabled={index === videos.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move down"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* Remove button */}
          <button
            onClick={() => handleRemove(video.videoId)}
            disabled={removingId === video.videoId}
            className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
            aria-label="Remove from playlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
