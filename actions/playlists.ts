"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface PlaylistData {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  videoCount: number
  previewThumbnails: string[]
  totalDuration: number
}

export interface PlaylistVideoData {
  id: number
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: number | null
  position: number
  addedAt: string
}

export interface PlaylistWithVideos {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  videos: PlaylistVideoData[]
}

// Get all playlists with preview data
export async function getPlaylists(): Promise<PlaylistData[]> {
  const playlists = await prisma.playlist.findMany({
    include: {
      videos: {
        orderBy: { position: "asc" },
        take: 4,
        select: { thumbnail: true, duration: true }
      },
      _count: { select: { videos: true } }
    },
    orderBy: { updatedAt: "desc" }
  })

  return playlists.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    videoCount: p._count.videos,
    previewThumbnails: p.videos.map(v => v.thumbnail),
    totalDuration: p.videos.reduce((sum, v) => sum + (v.duration || 0), 0)
  }))
}

// Get single playlist with all videos
export async function getPlaylist(id: number): Promise<PlaylistWithVideos | null> {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      videos: { orderBy: { position: "asc" } }
    }
  })

  if (!playlist) return null

  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
    videos: playlist.videos.map(v => ({
      id: v.id,
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      channelId: v.channelId,
      channelName: v.channelName,
      duration: v.duration,
      position: v.position,
      addedAt: v.addedAt.toISOString()
    }))
  }
}

// Get playlists for a specific video (to show which playlists it's in)
export async function getPlaylistsForVideo(videoId: string): Promise<number[]> {
  const entries = await prisma.playlistVideo.findMany({
    where: { videoId },
    select: { playlistId: true }
  })
  return entries.map(e => e.playlistId)
}

// Create playlist
export async function createPlaylist(data: { name: string; description?: string }): Promise<{ success: true; data: PlaylistData } | { success: false; error: string }> {
  try {
    const playlist = await prisma.playlist.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null
      }
    })

    revalidatePath("/playlists")

    return {
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
        videoCount: 0,
        previewThumbnails: [],
        totalDuration: 0
      }
    }
  } catch {
    return { success: false, error: "Failed to create playlist" }
  }
}

// Update playlist
export async function updatePlaylist(id: number, data: { name?: string; description?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.playlist.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description?.trim()
      }
    })

    revalidatePath("/playlists")
    revalidatePath(`/playlist/${id}`)

    return { success: true }
  } catch {
    return { success: false, error: "Failed to update playlist" }
  }
}

// Delete playlist
export async function deletePlaylist(id: number): Promise<{ success: boolean }> {
  try {
    await prisma.playlist.delete({ where: { id } })
    revalidatePath("/playlists")
    return { success: true }
  } catch {
    return { success: false }
  }
}

// Add video to playlist
export async function addToPlaylist(playlistId: number, videoData: {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already in playlist
    const existing = await prisma.playlistVideo.findUnique({
      where: { playlistId_videoId: { playlistId, videoId: videoData.videoId } }
    })

    if (existing) {
      return { success: false, error: "Video already in playlist" }
    }

    // Get last position
    const lastVideo = await prisma.playlistVideo.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" }
    })
    const position = (lastVideo?.position ?? -1) + 1

    await prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId: videoData.videoId,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        channelId: videoData.channelId,
        channelName: videoData.channelName,
        duration: videoData.duration ?? null,
        position
      }
    })

    // Update playlist timestamp
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() }
    })

    revalidatePath("/playlists")
    revalidatePath(`/playlist/${playlistId}`)

    return { success: true }
  } catch {
    return { success: false, error: "Failed to add to playlist" }
  }
}

// Remove video from playlist
export async function removeFromPlaylist(playlistId: number, videoId: string): Promise<{ success: boolean }> {
  try {
    await prisma.playlistVideo.delete({
      where: { playlistId_videoId: { playlistId, videoId } }
    })

    // Re-order positions
    const remaining = await prisma.playlistVideo.findMany({
      where: { playlistId },
      orderBy: { position: "asc" }
    })

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await prisma.playlistVideo.update({
          where: { id: remaining[i].id },
          data: { position: i }
        })
      }
    }

    revalidatePath("/playlists")
    revalidatePath(`/playlist/${playlistId}`)

    return { success: true }
  } catch {
    return { success: false }
  }
}

// Move video to new position
export async function reorderPlaylistVideo(playlistId: number, videoId: string, newPosition: number): Promise<{ success: boolean }> {
  try {
    const video = await prisma.playlistVideo.findUnique({
      where: { playlistId_videoId: { playlistId, videoId } }
    })

    if (!video) return { success: false }

    const oldPosition = video.position

    if (newPosition === oldPosition) return { success: true }

    if (newPosition > oldPosition) {
      // Moving down
      await prisma.playlistVideo.updateMany({
        where: {
          playlistId,
          position: { gt: oldPosition, lte: newPosition }
        },
        data: { position: { decrement: 1 } }
      })
    } else {
      // Moving up
      await prisma.playlistVideo.updateMany({
        where: {
          playlistId,
          position: { gte: newPosition, lt: oldPosition }
        },
        data: { position: { increment: 1 } }
      })
    }

    await prisma.playlistVideo.update({
      where: { id: video.id },
      data: { position: newPosition }
    })

    revalidatePath(`/playlist/${playlistId}`)

    return { success: true }
  } catch {
    return { success: false }
  }
}

// Toggle video in playlist (add if not present, remove if present)
export async function toggleVideoInPlaylist(playlistId: number, videoData: {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number | null
}): Promise<{ success: boolean; added: boolean }> {
  const existing = await prisma.playlistVideo.findUnique({
    where: { playlistId_videoId: { playlistId, videoId: videoData.videoId } }
  })

  if (existing) {
    const result = await removeFromPlaylist(playlistId, videoData.videoId)
    return { success: result.success, added: false }
  } else {
    const result = await addToPlaylist(playlistId, videoData)
    return { success: result.success, added: true }
  }
}

// Get all playlists with a flag indicating if video is in each
export async function getPlaylistsWithVideoStatus(videoId: string): Promise<Array<{ id: number; name: string; hasVideo: boolean }>> {
  const playlists = await prisma.playlist.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      videos: {
        where: { videoId },
        select: { id: true }
      }
    }
  })

  return playlists.map(p => ({
    id: p.id,
    name: p.name,
    hasVideo: p.videos.length > 0
  }))
}
