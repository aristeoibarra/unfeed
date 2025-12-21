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

export async function getSubscriptions() {
  return prisma.subscription.findMany({
    orderBy: { createdAt: "desc" }
  })
}

export async function getSubscription(channelId: string) {
  return prisma.subscription.findUnique({
    where: { channelId }
  })
}

export async function addSubscription(url: string): Promise<ActionResult<{ id: number }>> {
  const validation = urlSchema.safeParse(url)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const channelInfo = await getChannelInfo(url)
    if (!channelInfo) {
      return { success: false, error: "Could not find channel" }
    }

    const existing = await prisma.subscription.findUnique({
      where: { channelId: channelInfo.channelId }
    })

    if (existing) {
      return { success: false, error: "Already subscribed" }
    }

    const subscription = await prisma.subscription.create({
      data: {
        channelId: channelInfo.channelId,
        name: channelInfo.name,
        thumbnail: channelInfo.thumbnail,
      }
    })

    revalidatePath("/")
    revalidatePath("/subscriptions")

    return { success: true, data: { id: subscription.id } }
  } catch (error) {
    console.error("Error adding subscription:", error)
    return { success: false, error: "Failed to add subscription" }
  }
}

export async function deleteSubscription(id: number): Promise<ActionResult<null>> {
  try {
    await prisma.subscription.delete({ where: { id } })

    revalidatePath("/")
    revalidatePath("/subscriptions")

    return { success: true, data: null }
  } catch (error) {
    console.error("Error deleting subscription:", error)
    return { success: false, error: "Failed to delete subscription" }
  }
}
