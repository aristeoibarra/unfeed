import Link from "next/link"
import { WatchedBadge } from "./WatchedBadge"

type ReactionType = "like" | "dislike" | null

interface VideoCardProps {
  videoId: string
  title: string
  thumbnail: string
  channelName: string
  channelId?: string
  publishedAt: string
  duration?: number | null  // Duración en segundos
  isWatched?: boolean
  hasNote?: boolean
  reaction?: ReactionType
}

// Formatea duración de segundos a MM:SS o H:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function VideoCard({ videoId, title, thumbnail, channelName, publishedAt, duration, isWatched, hasNote, reaction }: VideoCardProps) {
  const timeAgo = getTimeAgo(publishedAt)

  return (
    <Link href={`/watch/${videoId}`} className="group">
      <div className="space-y-2">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
          <img
            src={thumbnail}
            alt={title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${isWatched ? "opacity-60" : ""}`}
          />
          {isWatched && <WatchedBadge />}
          {hasNote && (
            <div className="absolute top-2 left-2 p-1.5 bg-yellow-500 text-white rounded-full" title="Has notes">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {reaction === "like" && (
            <div className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-full" title="Liked">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
              </svg>
            </div>
          )}
          {duration != null && duration > 0 && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
              {formatDuration(duration)}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-medium line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {channelName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {timeAgo}
          </p>
        </div>
      </div>
    </Link>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`
    }
  }

  return "Just now"
}
