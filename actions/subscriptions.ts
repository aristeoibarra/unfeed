"use server"

import { prisma } from "@/lib/db"
import { getChannelInfo } from "@/lib/youtube"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deepSync } from "./sync"

// Accepts: @handle, full YouTube URL, or channel name
const inputSchema = z.string().min(1, "Please enter a channel")

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getSubscriptions() {
  // Solo canales activos (no eliminados)
  return prisma.subscription.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: "desc" }
  })
}

export async function getSubscription(channelId: string) {
  return prisma.subscription.findUnique({
    where: { channelId },
    include: { category: true }
  })
}

export async function addSubscription(input: string): Promise<ActionResult<{ id: number; reactivated?: boolean }>> {
  const validation = inputSchema.safeParse(input.trim())
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  // Convert @handle or name to YouTube URL
  let url = input.trim()
  if (url.startsWith("@")) {
    url = `https://www.youtube.com/${url}`
  } else if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
    url = `https://www.youtube.com/@${url}`
  }

  try {
    const channelInfo = await getChannelInfo(url)
    if (!channelInfo) {
      return { success: false, error: "Could not find channel" }
    }

    // Buscar si existe (incluyendo eliminados)
    const existing = await prisma.subscription.findUnique({
      where: { channelId: channelInfo.channelId }
    })

    if (existing) {
      if (existing.deletedAt) {
        // Reactivar canal eliminado (soft delete)
        await prisma.subscription.update({
          where: { channelId: channelInfo.channelId },
          data: {
            deletedAt: null,
            // Actualizar nombre/thumbnail en caso de que hayan cambiado
            name: channelInfo.name,
            thumbnail: channelInfo.thumbnail
          }
        })

        revalidatePath("/")
        revalidatePath("/subscriptions")

        // No necesita Deep Sync, ya tiene videos en caché
        return { success: true, data: { id: existing.id, reactivated: true } }
      } else {
        // Ya está activo
        return { success: false, error: "Already subscribed" }
      }
    }

    // Crear nuevo + SyncStatus inicial
    const subscription = await prisma.subscription.create({
      data: {
        channelId: channelInfo.channelId,
        name: channelInfo.name,
        thumbnail: channelInfo.thumbnail,
        syncStatus: {
          create: {
            status: "pending"
          }
        }
      }
    })

    // Ejecutar Deep Sync en background (no bloqueamos la respuesta)
    deepSync(channelInfo.channelId).catch(console.error)

    revalidatePath("/")
    revalidatePath("/subscriptions")

    return { success: true, data: { id: subscription.id } }
  } catch (error) {
    console.error("Error adding subscription:", error)
    return { success: false, error: "Failed to add subscription" }
  }
}

// Soft delete: Marca como eliminado pero no borra datos
export async function deleteSubscription(id: number): Promise<ActionResult<null>> {
  try {
    await prisma.subscription.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    revalidatePath("/")
    revalidatePath("/subscriptions")

    return { success: true, data: null }
  } catch (error) {
    console.error("Error deleting subscription:", error)
    return { success: false, error: "Failed to delete subscription" }
  }
}

// Hard delete: Borra completamente (para limpieza manual)
export async function hardDeleteSubscription(id: number): Promise<ActionResult<null>> {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { id } })
    if (!subscription) {
      return { success: false, error: "Subscription not found" }
    }

    // Borrar videos del canal
    await prisma.video.deleteMany({ where: { channelId: subscription.channelId } })

    // Borrar sync status
    await prisma.syncStatus.deleteMany({ where: { channelId: subscription.channelId } })

    // Borrar suscripción
    await prisma.subscription.delete({ where: { id } })

    revalidatePath("/")
    revalidatePath("/subscriptions")

    return { success: true, data: null }
  } catch (error) {
    console.error("Error hard deleting subscription:", error)
    return { success: false, error: "Failed to delete subscription" }
  }
}
