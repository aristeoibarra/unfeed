import Link from "next/link"

interface VideoCardProps {
  videoId: string
  title: string
  thumbnail: string
  channelName: string
  publishedAt: string
}

export function VideoCard({ videoId, title, thumbnail, channelName, publishedAt }: VideoCardProps) {
  const timeAgo = getTimeAgo(publishedAt)

  return (
    <Link href={`/watch/${videoId}`} className="group">
      <div className="space-y-2">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
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
