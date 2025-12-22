"use client"

import { useState } from "react"
import Link from "next/link"
import { deletePlaylist, updatePlaylist, type PlaylistData } from "@/actions/playlists"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PlaylistCardProps {
  playlist: PlaylistData
  onDelete: (id: number) => void
  onUpdate: (id: number, name: string) => void
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Updated today"
  if (diffDays === 1) return "Updated yesterday"
  if (diffDays < 7) return `Updated ${diffDays} days ago`
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`
  return `Updated ${Math.floor(diffDays / 30)} months ago`
}

export function PlaylistCard({ playlist, onDelete, onUpdate }: PlaylistCardProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(playlist.name)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    setDeleting(true)
    const result = await deletePlaylist(playlist.id)
    if (result.success) {
      onDelete(playlist.id)
    }
    setDeleting(false)
    setShowDeleteDialog(false)
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!name.trim()) return

    await updatePlaylist(playlist.id, { name: name.trim() })
    onUpdate(playlist.id, name.trim())
    setEditing(false)
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setEditing(true)
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setName(playlist.name)
    setEditing(false)
  }

  return (
    <>
      <Link
        href={`/playlist/${playlist.id}`}
        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex gap-4">
          {/* Thumbnail grid */}
          <div className="w-32 h-20 flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-0.5 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
            {playlist.previewThumbnails.slice(0, 4).map((thumb, i) => (
              <img
                key={i}
                src={thumb}
                alt=""
                className="w-full h-full object-cover"
              />
            ))}
            {Array.from({ length: Math.max(0, 4 - playlist.previewThumbnails.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full h-full bg-gray-300 dark:bg-gray-600" />
            ))}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  autoFocus
                  onClick={e => e.preventDefault()}
                />
                <button
                  onClick={handleSave}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h3 className="font-medium truncate">{playlist.name}</h3>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {playlist.videoCount} {playlist.videoCount === 1 ? "video" : "videos"}
              {playlist.totalDuration > 0 && ` · ${formatDuration(playlist.totalDuration)}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatTimeAgo(playlist.updatedAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Edit playlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
              aria-label="Delete playlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </Link>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{playlist.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
