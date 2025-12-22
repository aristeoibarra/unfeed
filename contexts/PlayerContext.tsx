"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { updateProgress } from "@/actions/history"
import type { YouTubePlayerControls } from "@/hooks/useYouTubePlayer"

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

  // History tracking
  historyId: number | null
  setHistoryId: (id: number | null) => void

  // Saved progress for resume
  savedProgress: number | null
  setSavedProgress: (progress: number | null) => void

  // Actions
  playVideo: (video: VideoInfo) => void
  pause: () => void
  resume: () => void
  toggleAudioMode: () => void
  seek: (time: number) => void
  stop: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void

  // Audio ref for controlling playback
  audioRef: React.RefObject<HTMLAudioElement | null>
  setAudioUrl: (url: string | null) => void
  audioUrl: string | null

  // YouTube player controls via postMessage
  youtubePlayerControls: YouTubePlayerControls | null
  setYouTubePlayerControls: (controls: YouTubePlayerControls | null) => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

// Progress save interval in milliseconds (10 seconds)
const PROGRESS_SAVE_INTERVAL = 10000

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [historyId, setHistoryId] = useState<number | null>(null)
  const [savedProgress, setSavedProgress] = useState<number | null>(null)
  const [youtubePlayerControls, setYouTubePlayerControls] = useState<YouTubePlayerControls | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastSavedProgressRef = useRef<number>(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      if (isAudioMode) {
        audioRef.current?.play()
      } else if (youtubePlayerControls) {
        youtubePlayerControls.playVideo()
      }
      setIsPlaying(true)
    })

    navigator.mediaSession.setActionHandler("pause", () => {
      if (isAudioMode) {
        audioRef.current?.pause()
      } else if (youtubePlayerControls) {
        youtubePlayerControls.pauseVideo()
      }
      setIsPlaying(false)
    })

    navigator.mediaSession.setActionHandler("seekbackward", () => {
      const newTime = Math.max(0, currentTime - 10)
      if (isAudioMode && audioRef.current) {
        audioRef.current.currentTime = newTime
      } else if (youtubePlayerControls) {
        youtubePlayerControls.seekTo(newTime, true)
      }
      setCurrentTime(newTime)
    })

    navigator.mediaSession.setActionHandler("seekforward", () => {
      const newTime = currentTime + 10
      if (isAudioMode && audioRef.current) {
        audioRef.current.currentTime = newTime
      } else if (youtubePlayerControls) {
        youtubePlayerControls.seekTo(newTime, true)
      }
      setCurrentTime(newTime)
    })

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        if (isAudioMode && audioRef.current) {
          audioRef.current.currentTime = details.seekTime
        } else if (youtubePlayerControls) {
          youtubePlayerControls.seekTo(details.seekTime, true)
        }
        setCurrentTime(details.seekTime)
      }
    })

    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("seekbackward", null)
      navigator.mediaSession.setActionHandler("seekforward", null)
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }, [currentVideo, isAudioMode, currentTime, youtubePlayerControls])

  // Update position state for Media Session
  useEffect(() => {
    if (!("mediaSession" in navigator)) return

    navigator.mediaSession.setPositionState({
      duration: duration,
      playbackRate: 1,
      position: currentTime
    })
  }, [currentTime, duration])

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (!historyId || !isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      return
    }

    const saveProgress = () => {
      const time = Math.floor(currentTime)
      const dur = Math.floor(duration)

      // Only save if time has changed significantly (at least 5 seconds)
      if (time > 0 && dur > 0 && Math.abs(time - lastSavedProgressRef.current) >= 5) {
        lastSavedProgressRef.current = time
        updateProgress(historyId, time, dur).catch(console.error)
      }
    }

    // Initial save after 5 seconds of playback
    const initialTimeout = setTimeout(() => {
      saveProgress()

      // Then save every 10 seconds
      progressIntervalRef.current = setInterval(saveProgress, PROGRESS_SAVE_INTERVAL)
    }, 5000)

    return () => {
      clearTimeout(initialTimeout)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [historyId, isPlaying, currentTime, duration])

  // Save progress when video stops or changes
  useEffect(() => {
    return () => {
      if (historyId && currentTime > 0 && duration > 0) {
        updateProgress(historyId, Math.floor(currentTime), Math.floor(duration)).catch(console.error)
      }
    }
  }, [historyId, currentTime, duration])

  const playVideo = useCallback((video: VideoInfo) => {
    setCurrentVideo(video)
    setIsPlaying(true)
    setCurrentTime(0)
    setDuration(video.duration || 0)
    lastSavedProgressRef.current = 0
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    if (isAudioMode) {
      audioRef.current?.pause()
    } else if (youtubePlayerControls) {
      youtubePlayerControls.pauseVideo()
    }
  }, [isAudioMode, youtubePlayerControls])

  const resume = useCallback(() => {
    setIsPlaying(true)
    if (isAudioMode) {
      audioRef.current?.play()
    } else if (youtubePlayerControls) {
      youtubePlayerControls.playVideo()
    }
  }, [isAudioMode, youtubePlayerControls])

  const toggleAudioMode = useCallback(() => {
    setIsAudioMode(prev => !prev)
  }, [])

  const seek = useCallback((time: number) => {
    setCurrentTime(time)
    if (isAudioMode && audioRef.current) {
      audioRef.current.currentTime = time
    } else if (youtubePlayerControls) {
      youtubePlayerControls.seekTo(time, true)
    }
  }, [isAudioMode, youtubePlayerControls])

  const stop = useCallback(() => {
    // Save final progress before stopping
    if (historyId && currentTime > 0 && duration > 0) {
      updateProgress(historyId, Math.floor(currentTime), Math.floor(duration)).catch(console.error)
    }

    setCurrentVideo(null)
    setIsPlaying(false)
    setIsAudioMode(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioUrl(null)
    setHistoryId(null)
    setSavedProgress(null)
    lastSavedProgressRef.current = 0
  }, [historyId, currentTime, duration])

  // Sync audio element events with context state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isAudioMode) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [isAudioMode])

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        isAudioMode,
        currentTime,
        duration,
        historyId,
        setHistoryId,
        savedProgress,
        setSavedProgress,
        playVideo,
        pause,
        resume,
        toggleAudioMode,
        seek,
        stop,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        audioRef,
        audioUrl,
        setAudioUrl,
        youtubePlayerControls,
        setYouTubePlayerControls,
      }}
    >
      {children}
      {/* Single audio element for all audio playback */}
      {audioUrl && isAudioMode && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
        />
      )}
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
