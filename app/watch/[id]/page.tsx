import { getVideo } from "@/actions/videos"
import { Player } from "@/components/Player"
import { notFound } from "next/navigation"
import Link from "next/link"

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: WatchPageProps) {
  const { id } = await params
  const video = await getVideo(id)

  if (!video) {
    return { title: "Video not found - Unfeed" }
  }

  return {
    title: `${video.title} - Unfeed`,
    description: `Watch ${video.title} by ${video.channelName}`,
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params
  const video = await getVideo(id)

  if (!video) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Player videoId={id} />

      <div className="space-y-2">
        <h1 className="text-xl font-bold">{video.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{video.channelName}</p>
      </div>

      <Link
        href="/"
        className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
      >
        Back to feed
      </Link>
    </div>
  )
}
