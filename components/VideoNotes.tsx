"use client"

import { saveNote, deleteNote } from "@/actions/notes"
import { useState, useEffect, useRef, useCallback } from "react"

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
    if (confirm("Delete this note?")) {
      await deleteNote(videoId)
      setContent("")
      setLastSaved(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Notes</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {saving && <span>Saving...</span>}
          {!saving && lastSaved && (
            <span>Saved {formatTime(lastSaved)}</span>
          )}
          {content && (
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add notes about this video..."
        className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
