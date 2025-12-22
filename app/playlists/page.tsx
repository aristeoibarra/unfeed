import { getPlaylists } from "@/actions/playlists"
import { PlaylistsPageClient } from "./PlaylistsPageClient"
import { Button } from "@/components/ui/button"
import { ListVideo, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Playlists - Unfeed",
  description: "Your video playlists"
}

export default async function PlaylistsPage() {
  const playlists = await getPlaylists()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <ListVideo className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
            </p>
          </div>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to feed
          </Button>
        </Link>
      </header>

      <PlaylistsPageClient initialPlaylists={playlists} />
    </div>
  )
}
