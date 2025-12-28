import { getVideo } from "@/actions/videos"
import { isInWatchLater } from "@/actions/watch-later"
import { getNote } from "@/actions/notes"
import { getReaction } from "@/actions/reactions"
import { getSettings } from "@/actions/settings"
import { VideoPlayer } from "@/components/VideoPlayer"
import { VideoNotes } from "@/components/VideoNotes"
import { WatchTimeProgress } from "@/components/WatchTimeProgress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, StickyNote } from "lucide-react"

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
  const [video, inWatchLater, note, reaction, settings] = await Promise.all([
    getVideo(id),
    isInWatchLater(id),
    getNote(id),
    getReaction(id),
    getSettings()
  ])

  if (!video) {
    notFound()
  }

  const hasLimitsConfigured = settings.dailyLimitMinutes !== null || settings.weeklyLimitMinutes !== null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back navigation - Clear for TDA users */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to feed
          </Button>
        </Link>
        {hasLimitsConfigured && (
          <WatchTimeProgress className="text-gray-600 dark:text-gray-300" />
        )}
      </nav>

      {/* Main video player */}
      <VideoPlayer
        videoId={id}
        video={video}
        initialInWatchLater={inWatchLater}
        initialReaction={reaction}
      />

      {/* Notes section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <StickyNote className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            </div>
            <CardTitle>Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <VideoNotes videoId={id} initialNote={note} />
        </CardContent>
      </Card>
    </div>
  )
}
