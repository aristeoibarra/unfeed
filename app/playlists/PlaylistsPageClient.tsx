"use client"

import { useState } from "react"
import { PlaylistCard } from "@/components/PlaylistCard"
import { createPlaylist, type PlaylistData } from "@/actions/playlists"

interface PlaylistsPageClientProps {
  initialPlaylists: PlaylistData[]
}

export function PlaylistsPageClient({ initialPlaylists }: PlaylistsPageClientProps) {
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    const result = await createPlaylist({ name: newName.trim() })

    if (result.success) {
      setPlaylists([result.data, ...playlists])
      setNewName("")
      setCreating(false)
    }

    setLoading(false)
  }

  function handleDelete(id: number) {
    setPlaylists(playlists.filter(p => p.id !== id))
  }

  function handleUpdate(id: number, name: string) {
    setPlaylists(playlists.map(p => p.id === id ? { ...p, name } : p))
  }

  return (
    <div className="space-y-4">
      {/* Create new playlist */}
      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName("") }}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Playlist
        </button>
      )}

      {/* Playlist list */}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            No playlists yet.
          </p>
          <p className="text-sm text-foreground-dim">
            Create a playlist to organize your favorite videos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
