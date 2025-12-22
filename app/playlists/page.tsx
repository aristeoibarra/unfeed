import { getPlaylists } from "@/actions/playlists"
import { PlaylistsPageClient } from "./PlaylistsPageClient"
import Link from "next/link"

export const metadata = {
  title: "Playlists - Unfeed",
  description: "Your video playlists"
}

export default async function PlaylistsPage() {
  const playlists = await getPlaylists()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Playlists</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
          </p>
        </div>
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to feed
        </Link>
      </div>

      <PlaylistsPageClient initialPlaylists={playlists} />
    </div>
  )
}
