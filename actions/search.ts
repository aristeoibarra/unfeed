"use server"

import { prisma } from "@/lib/db"

/**
 * Search result type for video search
 * Optimized to return only essential fields for the search UI
 */
export interface SearchResult {
  videoId: string
  title: string
  thumbnail: string
  channelName: string
  channelId: string
  publishedAt: string
  duration: number | null
}

/**
 * Search response type
 */
export interface SearchResponse {
  results: SearchResult[]
  query: string
  totalCount: number
}

// Maximum results to return for search (kept small for performance and TDA-friendly UI)
const MAX_SEARCH_RESULTS = 10

// Minimum query length to perform search
const MIN_QUERY_LENGTH = 2

/**
 * Sanitize and validate search query
 * Prevents SQL injection and normalizes input
 */
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    // Remove potentially dangerous characters
    .replace(/[<>{}[\]\\]/g, "")
    // Normalize multiple spaces to single space
    .replace(/\s+/g, " ")
    // Limit length
    .slice(0, 100)
}

/**
 * Search videos by title or channel name
 *
 * Design decisions for TDA users:
 * - Limited results (10 max) to avoid overwhelming
 * - Quick response time prioritized
 * - Returns essential fields only
 * - Case-insensitive search
 * - Searches both title and channel name
 */
export async function searchVideos(query: string): Promise<SearchResponse> {
  const sanitizedQuery = sanitizeQuery(query)

  // Return empty results for short queries
  if (sanitizedQuery.length < MIN_QUERY_LENGTH) {
    return {
      results: [],
      query: sanitizedQuery,
      totalCount: 0
    }
  }

  try {
    // Get only active subscriptions' channel IDs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { deletedAt: null },
      select: { channelId: true }
    })

    const activeChannelIds = activeSubscriptions.map(s => s.channelId)

    if (activeChannelIds.length === 0) {
      return {
        results: [],
        query: sanitizedQuery,
        totalCount: 0
      }
    }

    // Search videos with case-insensitive matching
    // Using contains for both title and channelName
    const videos = await prisma.video.findMany({
      where: {
        channelId: { in: activeChannelIds },
        OR: [
          { title: { contains: sanitizedQuery } },
          { channelName: { contains: sanitizedQuery } }
        ]
      },
      select: {
        videoId: true,
        title: true,
        thumbnail: true,
        channelName: true,
        channelId: true,
        publishedAt: true,
        duration: true
      },
      orderBy: { publishedAt: "desc" },
      take: MAX_SEARCH_RESULTS
    })

    // Get total count for potential "show more" feature
    const totalCount = await prisma.video.count({
      where: {
        channelId: { in: activeChannelIds },
        OR: [
          { title: { contains: sanitizedQuery } },
          { channelName: { contains: sanitizedQuery } }
        ]
      }
    })

    const results: SearchResult[] = videos.map(video => ({
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      channelId: video.channelId,
      publishedAt: video.publishedAt.toISOString(),
      duration: video.duration
    }))

    return {
      results,
      query: sanitizedQuery,
      totalCount
    }
  } catch (error) {
    console.error("Search error:", error)
    return {
      results: [],
      query: sanitizedQuery,
      totalCount: 0
    }
  }
}

/**
 * Get recent videos for initial search state
 * Shows recent videos when search dialog opens (before user types)
 * Helps TDA users by providing immediate context
 */
export async function getRecentVideos(): Promise<SearchResult[]> {
  try {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { deletedAt: null },
      select: { channelId: true }
    })

    const activeChannelIds = activeSubscriptions.map(s => s.channelId)

    if (activeChannelIds.length === 0) {
      return []
    }

    const videos = await prisma.video.findMany({
      where: {
        channelId: { in: activeChannelIds }
      },
      select: {
        videoId: true,
        title: true,
        thumbnail: true,
        channelName: true,
        channelId: true,
        publishedAt: true,
        duration: true
      },
      orderBy: { publishedAt: "desc" },
      take: 5
    })

    return videos.map(video => ({
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      channelId: video.channelId,
      publishedAt: video.publishedAt.toISOString(),
      duration: video.duration
    }))
  } catch (error) {
    console.error("Recent videos error:", error)
    return []
  }
}
