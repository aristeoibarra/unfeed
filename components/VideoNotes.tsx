"use client"

import { saveNote, deleteNote } from "@/actions/notes"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VideoNotesProps {
  videoId: string
  initialNote?: {
    content: string
    updatedAt: Date
  } | null
}

export function VideoNotes({ videoId, initialNote }: VideoNotesProps) {
  const [content, setContent] = useState(initialNote?.content || "")
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialNote?.updatedAt ? new Date(initialNote.updatedAt) : null
  )
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced auto-save using refs to avoid stale closures
  const saveNoteRef = useCallback(async (text: string) => {
    if (text.trim()) {
      setSaving(true)
      await saveNote(videoId, text)
      setLastSaved(new Date())
      setSaving(false)
    }
  }, [videoId])

  useEffect(() => {
    if (content !== (initialNote?.content || "")) {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Set new timeout for debounced save
      timeoutRef.current = setTimeout(() => {
        saveNoteRef(content)
      }, 1000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, saveNoteRef, initialNote?.content])

  async function handleDelete() {
    await deleteNote(videoId)
    setContent("")
    setLastSaved(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Notes</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saving && <span>Saving...</span>}
          {!saving && lastSaved && (
            <span>Saved {formatTime(lastSaved)}</span>
          )}
          {content && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-destructive hover:text-destructive/80">
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your note for this video.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add notes about this video..."
        className="w-full h-32 p-3 border border-border rounded-lg bg-card resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return "just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return date.toLocaleTimeString()
}
