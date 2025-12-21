import { getChannel } from "@/actions/channels";
import { getVideosByChannel } from "@/actions/videos";
import { getWatchedVideoIds } from "@/actions/watched";
import { ChannelHeader } from "@/components/ChannelHeader";
import { VideoCard } from "@/components/VideoCard";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export async function generateMetadata({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const channel = await getChannel(channelId);

  if (!channel) {
    return { title: "Channel not found - Unfeed" };
  }

  return {
    title: `${channel.name} - Unfeed`,
    description: `Videos from ${channel.name}`,
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const [channel, videos, watchedIds] = await Promise.all([
    getChannel(channelId),
    getVideosByChannel(channelId),
    getWatchedVideoIds(),
  ]);

  if (!channel) {
    notFound();
  }

  const watchedSet = new Set(watchedIds);

  return (
    <div className="space-y-6">
      <ChannelHeader channel={channel} />

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No videos found for this channel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title}
              thumbnail={video.thumbnail}
              channelName={video.channelName}
              channelId={video.channelId}
              publishedAt={video.publishedAt}
              isWatched={watchedSet.has(video.videoId)}
            />
          ))}
        </div>
      )}

      <Link
        href="/"
        className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
      >
        Back to feed
      </Link>
    </div>
  );
}
