"use client"

import { useState, useEffect } from "react"
import { usePlayer } from "@/contexts/PlayerContext"
import Link from "next/link"

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function MiniPlayer() {
  const {
    currentVideo,
    isPlaying,
    isAudioMode,
    audioRef,
    audioUrl,
    pause,
    resume,
    stop,
  } = usePlayer()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration || 0)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
    }
  }, [audioRef])

  // Only show when in audio mode and have a video
  if (!currentVideo || !isAudioMode) {
    return null
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Hidden audio element for background playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay={isPlaying}
        />
      )}

      {/* Fixed mini player at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 shadow-lg">
        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <Link
              href={`/watch/${currentVideo.videoId}`}
              className="w-12 h-12 flex-shrink-0 rounded overflow-hidden"
            >
              <img
                src={currentVideo.thumbnail}
                alt={currentVideo.title}
                className="w-full h-full object-cover"
              />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/watch/${currentVideo.videoId}`}
                className="font-medium text-sm text-white line-clamp-1 hover:text-blue-400"
              >
                {currentVideo.title}
              </Link>
              <p className="text-xs text-gray-400 line-clamp-1">
                {currentVideo.channelName}
              </p>
            </div>

            {/* Time */}
            <div className="hidden sm:block text-xs text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? pause : resume}
                className="p-2 text-white hover:text-blue-400 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Close */}
              <button
                onClick={stop}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close player"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind mini player */}
      <div className="h-20" />
    </>
  )
}
