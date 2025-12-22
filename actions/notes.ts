"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Maximum content length to prevent DoS attacks
const MAX_NOTE_LENGTH = 10000

const videoIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid video ID format")
const contentSchema = z.string().max(MAX_NOTE_LENGTH, `Note cannot exceed ${MAX_NOTE_LENGTH} characters`)

export async function getVideoIdsWithNotes(): Promise<string[]> {
  const notes = await prisma.videoNote.findMany({
    select: { videoId: true }
  })
  return notes.map(n => n.videoId)
}

export async function getNote(videoId: string) {
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    return null
  }
  return prisma.videoNote.findUnique({
    where: { videoId }
  })
}

export async function saveNote(videoId: string, content: string) {
  const videoIdValidation = videoIdSchema.safeParse(videoId)
  const contentValidation = contentSchema.safeParse(content)

  if (!videoIdValidation.success) {
    throw new Error("Invalid video ID")
  }
  if (!contentValidation.success) {
    throw new Error(contentValidation.error.issues[0].message)
  }

  const note = await prisma.videoNote.upsert({
    where: { videoId },
    update: { content },
    create: { videoId, content }
  })
  revalidatePath(`/watch/${videoId}`)
  return note
}

export async function deleteNote(videoId: string) {
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    return
  }

  await prisma.videoNote.delete({
    where: { videoId }
  }).catch(() => {
    // Ignore if not found
  })
  revalidatePath(`/watch/${videoId}`)
}
