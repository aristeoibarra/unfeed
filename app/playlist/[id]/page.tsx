import { getPlaylist } from "@/actions/playlists"
import { PlaylistVideoList } from "@/components/PlaylistVideoList"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PlaylistPageProps {
  params: Promise<{ id: string }>
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} min`
}

export async function generateMetadata({ params }: PlaylistPageProps) {
  const { id } = await params
  const playlist = await getPlaylist(parseInt(id))

  if (!playlist) {
    return { title: "Playlist not found - Unfeed" }
  }

  return {
    title: `${playlist.name} - Unfeed`,
    description: `Playlist with ${playlist.videos.length} videos`
  }
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params
  const playlist = await getPlaylist(parseInt(id))

  if (!playlist) {
    notFound()
  }

  const totalDuration = playlist.videos.reduce((sum, v) => sum + (v.duration || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {playlist.videos.length} {playlist.videos.length === 1 ? "video" : "videos"}
            {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
          </p>
          {playlist.description && (
            <p className="text-foreground-dim text-sm mt-2">{playlist.description}</p>
          )}
        </div>
        <Link
          href="/playlists"
          className="text-primary hover:underline"
        >
          Back to playlists
        </Link>
      </div>

      {playlist.videos.length > 0 && (
        <div className="flex gap-2">
          <Link
            href={`/watch/${playlist.videos[0].videoId}?playlist=${playlist.id}`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Play all
          </Link>
        </div>
      )}

      <PlaylistVideoList playlistId={playlist.id} initialVideos={playlist.videos} />
    </div>
  )
}
