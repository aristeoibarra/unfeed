"use server"

import { prisma } from "@/lib/db"
import { getChannelInfo } from "@/lib/youtube"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const urlSchema = z.string().url().refine(
  (url) => url.includes("youtube.com") || url.includes("youtu.be"),
  { message: "Must be a YouTube URL" }
)

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getChannels() {
  return prisma.channel.findMany({
    orderBy: { createdAt: "desc" }
  })
}

export async function addChannel(url: string): Promise<ActionResult<{ id: number }>> {
  const validation = urlSchema.safeParse(url)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const channelInfo = await getChannelInfo(url)
    if (!channelInfo) {
      return { success: false, error: "Could not find channel" }
    }

    // Check if channel already exists
    const existing = await prisma.channel.findUnique({
      where: { channelId: channelInfo.channelId }
    })

    if (existing) {
      return { success: false, error: "Channel already added" }
    }

    const channel = await prisma.channel.create({
      data: {
        channelId: channelInfo.channelId,
        name: channelInfo.name,
        thumbnail: channelInfo.thumbnail,
      }
    })

    revalidatePath("/")
    revalidatePath("/channels")

    return { success: true, data: { id: channel.id } }
  } catch (error) {
    console.error("Error adding channel:", error)
    return { success: false, error: "Failed to add channel" }
  }
}

export async function deleteChannel(id: number): Promise<ActionResult<null>> {
  try {
    await prisma.channel.delete({ where: { id } })

    revalidatePath("/")
    revalidatePath("/channels")

    return { success: true, data: null }
  } catch (error) {
    console.error("Error deleting channel:", error)
    return { success: false, error: "Failed to delete channel" }
  }
}
