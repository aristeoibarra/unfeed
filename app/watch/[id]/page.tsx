import { getVideo } from "@/actions/videos"
import { isWatched } from "@/actions/watched"
import { isInWatchLater } from "@/actions/watch-later"
import { getNote } from "@/actions/notes"
import { VideoPlayer } from "@/components/VideoPlayer"
import { VideoNotes } from "@/components/VideoNotes"
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
  const [video, watched, inWatchLater, note] = await Promise.all([
    getVideo(id),
    isWatched(id),
    isInWatchLater(id),
    getNote(id)
  ])

  if (!video) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <VideoPlayer
        videoId={id}
        video={video}
        initialWatched={watched}
        initialInWatchLater={inWatchLater}
      />

      <VideoNotes videoId={id} initialNote={note} />

      <Link
        href="/"
        className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
      >
        Back to feed
      </Link>
    </div>
  )
}
