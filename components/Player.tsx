"use client"

interface PlayerProps {
  videoId: string
  onWatched?: () => void
}

// Validate YouTube video ID format (11 alphanumeric characters)
function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

export function Player({ videoId }: PlayerProps) {
  // Validate video ID to prevent injection
  if (!isValidVideoId(videoId)) {
    return (
      <div className="relative aspect-video w-full flex items-center justify-center bg-gray-900 rounded-lg">
        <p className="text-gray-400">Invalid video ID</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0`}
        className="absolute inset-0 w-full h-full rounded-lg"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
