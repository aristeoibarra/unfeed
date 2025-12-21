"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getNote(videoId: string) {
  return prisma.videoNote.findUnique({
    where: { videoId }
  })
}

export async function saveNote(videoId: string, content: string) {
  const note = await prisma.videoNote.upsert({
    where: { videoId },
    update: { content },
    create: { videoId, content }
  })
  revalidatePath(`/watch/${videoId}`)
  return note
}

export async function deleteNote(videoId: string) {
  await prisma.videoNote.delete({
    where: { videoId }
  }).catch(() => {
    // Ignore if not found
  })
  revalidatePath(`/watch/${videoId}`)
}
