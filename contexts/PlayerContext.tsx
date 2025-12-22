"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"

interface VideoInfo {
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: number | null
}

interface PlayerContextType {
  // Current playing video
  currentVideo: VideoInfo | null
  isPlaying: boolean
  isAudioMode: boolean
  currentTime: number
  duration: number

  // Actions
  playVideo: (video: VideoInfo) => void
  pause: () => void
  resume: () => void
  toggleAudioMode: () => void
  seek: (time: number) => void
  stop: () => void

  // Audio ref for controlling playback
  audioRef: React.RefObject<HTMLAudioElement | null>
  setAudioUrl: (url: string | null) => void
  audioUrl: string | null
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Media Session API setup
  useEffect(() => {
    if (!currentVideo || !("mediaSession" in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentVideo.title,
      artist: currentVideo.channelName,
      album: "Unfeed",
      artwork: [
        { src: currentVideo.thumbnail, sizes: "512x512", type: "image/jpeg" }
      ]
    })

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play()
      setIsPlaying(true)
    })

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause()
      setIsPlaying(false)
    })

    navigator.mediaSession.setActionHandler("seekbackward", () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
      }
    })

    navigator.mediaSession.setActionHandler("seekforward", () => {
      if (audioRef.current) {
        audioRef.current.currentTime += 10
      }
    })

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime
      }
    })

    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("seekbackward", null)
      navigator.mediaSession.setActionHandler("seekforward", null)
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }, [currentVideo])

  // Update position state for Media Session
  useEffect(() => {
    if (!("mediaSession" in navigator) || !isAudioMode) return

    navigator.mediaSession.setPositionState({
      duration: duration,
      playbackRate: 1,
      position: currentTime
    })
  }, [currentTime, duration, isAudioMode])

  const playVideo = useCallback((video: VideoInfo) => {
    setCurrentVideo(video)
    setIsPlaying(true)
    setCurrentTime(0)
    setDuration(video.duration || 0)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    setIsPlaying(true)
    audioRef.current?.play()
  }, [])

  const toggleAudioMode = useCallback(() => {
    setIsAudioMode(prev => !prev)
  }, [])

  const seek = useCallback((time: number) => {
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const stop = useCallback(() => {
    setCurrentVideo(null)
    setIsPlaying(false)
    setIsAudioMode(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioUrl(null)
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        isAudioMode,
        currentTime,
        duration,
        playVideo,
        pause,
        resume,
        toggleAudioMode,
        seek,
        stop,
        audioRef,
        audioUrl,
        setAudioUrl,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider")
  }
  return context
}
