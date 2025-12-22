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
  // Campos expandidos
  duration: number | null      // Duración en segundos
  description: string | null
  tags: string | null          // Tags separados por coma
  category: string | null
  viewCount: number | null
  likeCount: number | null
}

// Parsea duración ISO 8601 (PT15M33S) a segundos
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)

  return hours * 3600 + minutes * 60 + seconds
}

// Mapa de IDs de categoría a nombres
const CATEGORY_MAP: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "18": "Short Movies",
  "19": "Travel & Events",
  "20": "Gaming",
  "21": "Videoblogging",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
  "30": "Movies",
  "31": "Anime/Animation",
  "32": "Action/Adventure",
  "33": "Classics",
  "34": "Comedy",
  "35": "Documentary",
  "36": "Drama",
  "37": "Family",
  "38": "Foreign",
  "39": "Horror",
  "40": "Sci-Fi/Fantasy",
  "41": "Thriller",
  "42": "Shorts",
  "43": "Shows",
  "44": "Trailers",
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

// Obtiene detalles expandidos de videos (duration, stats, etc.)
// Costo: 1 unidad por cada 50 videos
async function getVideoDetails(videoIds: string[]): Promise<Map<string, Partial<VideoInfo>>> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) {
    return new Map()
  }

  const details = new Map<string, Partial<VideoInfo>>()

  // YouTube API permite hasta 50 IDs por request
  const chunks = []
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50))
  }

  for (const chunk of chunks) {
    const url = `${YOUTUBE_API_BASE}/videos?part=contentDetails,statistics,snippet&id=${chunk.join(",")}&key=${YOUTUBE_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.items) {
      for (const item of data.items) {
        details.set(item.id, {
          duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : null,
          description: item.snippet?.description || null,
          tags: item.snippet?.tags?.join(",") || null,
          category: CATEGORY_MAP[item.snippet?.categoryId] || null,
          viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
          likeCount: item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : null,
        })
      }
    }
  }

  return details
}

export interface GetChannelVideosOptions {
  maxResults?: number  // Videos por página (default: 50)
  pages?: number       // Número de páginas a obtener (default: 1)
}

export async function getChannelVideos(
  channelIds: string[],
  pageTokens?: Record<string, string | null>,
  options?: GetChannelVideosOptions
): Promise<VideosResult> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured")
  }

  if (channelIds.length === 0) return { videos: [], pageTokens: {} }

  const maxResults = options?.maxResults ?? 50
  const pages = options?.pages ?? 1
  const basicVideos: Array<{
    videoId: string
    title: string
    thumbnail: string
    channelId: string
    channelName: string
    publishedAt: string
  }> = []
  const nextPageTokens: Record<string, string | null> = {}

  for (const channelId of channelIds) {
    let currentPageToken = pageTokens?.[channelId]

    // Skip if we've reached the end for this channel
    if (currentPageToken === null) {
      nextPageTokens[channelId] = null
      continue
    }

    // Obtener múltiples páginas si se solicita
    for (let page = 0; page < pages; page++) {
      let searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      if (currentPageToken) {
        searchUrl += `&pageToken=${currentPageToken}`
      }

      const res = await fetch(searchUrl)
      const data = await res.json()

      currentPageToken = data.nextPageToken || null

      if (data.items) {
        for (const item of data.items) {
          basicVideos.push({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            channelId: item.snippet.channelId,
            channelName: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
          })
        }
      }

      // Si no hay más páginas, salir
      if (!currentPageToken) break
    }

    nextPageTokens[channelId] = currentPageToken ?? null
  }

  // Obtener detalles expandidos de todos los videos
  const videoIds = basicVideos.map(v => v.videoId)
  const videoDetails = await getVideoDetails(videoIds)

  // Combinar datos básicos con detalles expandidos
  const videos: VideoInfo[] = basicVideos.map(video => {
    const details = videoDetails.get(video.videoId) || {}
    return {
      ...video,
      duration: details.duration ?? null,
      description: details.description ?? null,
      tags: details.tags ?? null,
      category: details.category ?? null,
      viewCount: details.viewCount ?? null,
      likeCount: details.likeCount ?? null,
    }
  })

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

  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
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
    duration: video.contentDetails?.duration ? parseDuration(video.contentDetails.duration) : null,
    description: video.snippet?.description || null,
    tags: video.snippet?.tags?.join(",") || null,
    category: CATEGORY_MAP[video.snippet?.categoryId] || null,
    viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount, 10) : null,
    likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount, 10) : null,
  }
}
