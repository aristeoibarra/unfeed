"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const NOTIFICATIONS_PER_PAGE = 20

export interface NotificationData {
  id: number
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: number | null
  isRead: boolean
  createdAt: Date
  readAt: Date | null
}

export interface NotificationsResult {
  notifications: NotificationData[]
  hasMore: boolean
  unreadCount: number
  total: number
}

// Obtener notificaciones con paginación
export async function getNotifications(page: number = 1): Promise<NotificationsResult> {
  const skip = (page - 1) * NOTIFICATIONS_PER_PAGE

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: NOTIFICATIONS_PER_PAGE
    }),
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } })
  ])

  return {
    notifications,
    hasMore: skip + notifications.length < total,
    unreadCount,
    total
  }
}

// Obtener solo el contador de no leídas (para la campanita)
export async function getUnreadCount(): Promise<number> {
  return prisma.notification.count({ where: { isRead: false } })
}

// Obtener últimas N notificaciones (para el dropdown)
export async function getRecentNotifications(limit: number = 5): Promise<NotificationData[]> {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit
  })
}

// Marcar una como leída
export async function markAsRead(notificationId: number): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })

  revalidatePath("/")
  revalidatePath("/notifications")
}

// Marcar todas como leídas
export async function markAllAsRead(): Promise<void> {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })

  revalidatePath("/")
  revalidatePath("/notifications")
}

// Crear notificación para un video nuevo
export async function createNotification(video: {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: number | null
}): Promise<void> {
  await prisma.notification.create({
    data: {
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelName: video.channelName,
      duration: video.duration
    }
  })
}

// Limpiar notificaciones antiguas (> 30 días)
export async function cleanOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo }
    }
  })

  return result.count
}
