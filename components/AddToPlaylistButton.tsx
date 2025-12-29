"use client"

import { useState, useEffect, useRef } from "react"
import {
  getPlaylistsWithVideoStatus,
  toggleVideoInPlaylist,
  createPlaylist
} from "@/actions/playlists"

interface VideoData {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number | null
}

interface AddToPlaylistButtonProps {
  video: VideoData
}

interface PlaylistStatus {
  id: number
  name: string
  hasVideo: boolean
}

export function AddToPlaylistButton({ video }: AddToPlaylistButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [playlists, setPlaylists] = useState<PlaylistStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setCreating(false)
        setNewName("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load playlists when opening
  async function handleOpen() {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setLoading(true)
      const data = await getPlaylistsWithVideoStatus(video.videoId)
      setPlaylists(data)
      setLoading(false)
    }
  }

  async function handleToggle(playlistId: number) {
    const result = await toggleVideoInPlaylist(playlistId, video)

    if (result.success) {
      setPlaylists(playlists.map(p =>
        p.id === playlistId ? { ...p, hasVideo: result.added } : p
      ))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    const result = await createPlaylist({ name: newName.trim() })

    if (result.success) {
      // Add to playlist immediately
      await toggleVideoInPlaylist(result.data.id, video)
      setPlaylists([{ id: result.data.id, name: result.data.name, hasVideo: true }, ...playlists])
      setNewName("")
      setCreating(false)
    }

    setLoading(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        title="Add to playlist"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <span className="text-sm font-medium">Playlist</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20">
          <div className="p-2 border-b border-border">
            <h3 className="font-medium text-sm">Add to playlist</h3>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : playlists.length === 0 && !creating ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No playlists yet
              </div>
            ) : (
              <div className="py-1">
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleToggle(playlist.id)}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      playlist.hasVideo ? "bg-primary border-primary" : "border-muted-foreground"
                    }`}>
                      {playlist.hasVideo && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{playlist.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border">
            {creating ? (
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Playlist name..."
                  className="flex-1 px-2 py-1 text-sm border border-border rounded bg-card"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newName.trim() || loading}
                  className="px-2 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-muted rounded flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create new playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
