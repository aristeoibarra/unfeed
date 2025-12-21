"use client"

interface PlayerProps {
  videoId: string
  onWatched?: () => void
}

export function Player({ videoId }: PlayerProps) {
  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0`}
        className="absolute inset-0 w-full h-full rounded-lg"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
