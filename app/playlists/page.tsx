import { getPlaylists } from "@/actions/playlists"
import { PlaylistsPageClient } from "./PlaylistsPageClient"
import { ListVideo } from "lucide-react"

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
          <div className="p-3 bg-chart-4/20 rounded-xl">
            <ListVideo className="h-6 w-6 text-chart-4" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
            <p className="text-muted-foreground text-sm">
              {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
            </p>
          </div>
        </div>
      </header>

      <PlaylistsPageClient initialPlaylists={playlists} />
    </div>
  )
}
