import Link from "next/link"
import { WatchedBadge } from "./WatchedBadge"

interface VideoCardProps {
  videoId: string
  title: string
  thumbnail: string
  channelName: string
  channelId?: string
  publishedAt: string
  isWatched?: boolean
  hasNote?: boolean
}

export function VideoCard({ videoId, title, thumbnail, channelName, publishedAt, isWatched, hasNote }: VideoCardProps) {
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
