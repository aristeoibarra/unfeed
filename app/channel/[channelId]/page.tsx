import { getChannel } from "@/actions/channels"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideosByChannel } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { ChannelHeader } from "@/components/ChannelHeader"
import { VideoFeed } from "@/components/VideoFeed"
import Link from "next/link"
import { notFound } from "next/navigation"

interface ChannelPageProps {
  params: Promise<{ channelId: string }>
}

export async function generateMetadata({ params }: ChannelPageProps) {
  const { channelId } = await params
  const channel = await getChannel(channelId)

  if (!channel) {
    return { title: "Channel not found - Unfeed" }
  }

  return {
    title: `${channel.name} - Unfeed`,
    description: `Videos from ${channel.name}`,
  }
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params
  const [channel, result, watchedIds, noteIds] = await Promise.all([
    getChannel(channelId),
    getVideosByChannel(channelId),
    getWatchedVideoIds(),
    getVideoIdsWithNotes(),
  ])

  if (!channel) {
    notFound()
  }

  const watchedSet = new Set(watchedIds)
  const noteSet = new Set(noteIds)

  return (
    <div className="space-y-6">
      <ChannelHeader channel={channel} />

      {result.videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No videos found for this channel.
          </p>
        </div>
      ) : (
        <VideoFeed
          initialVideos={result.videos}
          initialPageTokens={result.pageTokens}
          watchedIds={watchedSet}
          noteIds={noteSet}
          filterChannelId={channelId}
        />
      )}

      <Link
        href="/"
        className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
      >
        Back to feed
      </Link>
    </div>
  )
}
