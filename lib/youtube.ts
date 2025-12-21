const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

export interface ChannelInfo {
  channelId: string
  name: string
  thumbnail: string | null
}

export interface VideoInfo {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  publishedAt: string
}

function extractChannelId(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export async function getChannelInfo(url: string): Promise<ChannelInfo | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured")
  }

  const identifier = extractChannelId(url)
  if (!identifier) return null

  // Check if it's a handle (@username)
  const isHandle = url.includes("/@")

  let channelData = null

  if (isHandle) {
    // Use forHandle parameter for @username URLs
    const handleUrl = `${YOUTUBE_API_BASE}/channels?part=snippet&forHandle=${encodeURIComponent(identifier)}&key=${YOUTUBE_API_KEY}`
    const res = await fetch(handleUrl)
    const data = await res.json()

    if (data.items?.[0]) {
      channelData = data.items[0]
    }
  } else if (identifier.startsWith("UC")) {
    // Direct channel ID
    const channelUrl = `${YOUTUBE_API_BASE}/channels?part=snippet&id=${identifier}&key=${YOUTUBE_API_KEY}`
    const res = await fetch(channelUrl)
    const data = await res.json()

    if (data.items?.[0]) {
      channelData = data.items[0]
    }
  } else {
    // Try forUsername for /user/ URLs, then search as fallback
    const userUrl = `${YOUTUBE_API_BASE}/channels?part=snippet&forUsername=${encodeURIComponent(identifier)}&key=${YOUTUBE_API_KEY}`
    const userRes = await fetch(userUrl)
    const userData = await userRes.json()

    if (userData.items?.[0]) {
      channelData = userData.items[0]
    } else {
      // Fallback to search
      const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(identifier)}&maxResults=1&key=${YOUTUBE_API_KEY}`
      const searchRes = await fetch(searchUrl)
      const searchData = await searchRes.json()

      if (searchData.items?.[0]) {
        const channelId = searchData.items[0].snippet.channelId
        const channelUrl = `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
        const res = await fetch(channelUrl)
        const data = await res.json()

        if (data.items?.[0]) {
          channelData = data.items[0]
        }
      }
    }
  }

  if (!channelData) return null

  return {
    channelId: channelData.id,
    name: channelData.snippet.title,
    thumbnail: channelData.snippet.thumbnails?.default?.url || null,
  }
}

export interface VideosResult {
  videos: VideoInfo[]
  pageTokens: Record<string, string | null>
}

export async function getChannelVideos(
  channelIds: string[],
  pageTokens?: Record<string, string | null>
): Promise<VideosResult> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured")
  }

  if (channelIds.length === 0) return { videos: [], pageTokens: {} }

  const videos: VideoInfo[] = []
  const nextPageTokens: Record<string, string | null> = {}

  for (const channelId of channelIds) {
    const pageToken = pageTokens?.[channelId]

    // Skip if we've reached the end for this channel
    if (pageToken === null) {
      nextPageTokens[channelId] = null
      continue
    }

    let searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=12&key=${YOUTUBE_API_KEY}`
    if (pageToken) {
      searchUrl += `&pageToken=${pageToken}`
    }

    const res = await fetch(searchUrl)
    const data = await res.json()

    nextPageTokens[channelId] = data.nextPageToken || null

    if (data.items) {
      for (const item of data.items) {
        videos.push({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channelId: item.snippet.channelId,
          channelName: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
        })
      }
    }
  }

  // Sort by publish date (newest first)
  const sortedVideos = videos.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return { videos: sortedVideos, pageTokens: nextPageTokens }
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured")
  }

  const url = `${YOUTUBE_API_BASE}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (!data.items?.[0]) return null

  const video = data.items[0]
  return {
    videoId: video.id,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
    channelId: video.snippet.channelId,
    channelName: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
  }
}
