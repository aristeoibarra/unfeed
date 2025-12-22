"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// YouTube Player States
export const YouTubePlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export type YouTubePlayerStateValue = typeof YouTubePlayerState[keyof typeof YouTubePlayerState]

// Types for YouTube postMessage events
interface YouTubeInfoDelivery {
  currentTime?: number
  duration?: number
  videoData?: {
    video_id?: string
    title?: string
    author?: string
  }
  playerState?: YouTubePlayerStateValue
  volume?: number
  muted?: boolean
}

interface YouTubeEvent {
  event: "onReady" | "onStateChange" | "infoDelivery" | "onError" | "initialDelivery"
  info?: YouTubePlayerStateValue | YouTubeInfoDelivery | number
}

interface YouTubePostMessage {
  event: "command" | "listening"
  func?: string
  args?: (string | number | boolean)[]
  id?: number
}

export interface YouTubePlayerControls {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  mute: () => void
  unMute: () => void
  setVolume: (volume: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => YouTubePlayerStateValue
}

interface UseYouTubePlayerOptions {
  videoId: string
  autoplay?: boolean
  initialTime?: number
  onReady?: () => void
  onStateChange?: (state: YouTubePlayerStateValue) => void
  onError?: (errorCode: number) => void
  onTimeUpdate?: (currentTime: number) => void
}

interface UseYouTubePlayerReturn {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  isReady: boolean
  currentTime: number
  duration: number
  playerState: YouTubePlayerStateValue
  controls: YouTubePlayerControls
}

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"

export function useYouTubePlayer({
  videoId,
  autoplay = false,
  initialTime = 0,
  onReady,
  onStateChange,
  onError,
  onTimeUpdate,
}: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerState, setPlayerState] = useState<YouTubePlayerStateValue>(YouTubePlayerState.UNSTARTED)

  // Refs for storing latest values without re-renders
  const currentTimeRef = useRef(0)
  const durationRef = useRef(0)
  const playerStateRef = useRef<YouTubePlayerStateValue>(YouTubePlayerState.UNSTARTED)
  const isReadyRef = useRef(false)
  const initialTimeAppliedRef = useRef(false)
  const commandIdRef = useRef(0)

  // Send postMessage command to YouTube iframe
  const sendCommand = useCallback((func: string, args: (string | number | boolean)[] = []) => {
    if (!iframeRef.current?.contentWindow) return

    const message: YouTubePostMessage = {
      event: "command",
      func,
      args,
      id: ++commandIdRef.current,
    }

    iframeRef.current.contentWindow.postMessage(JSON.stringify(message), YOUTUBE_ORIGIN)
  }, [])

  // Initialize listening for YouTube events
  const initializeListening = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return

    const message: YouTubePostMessage = {
      event: "listening",
      id: ++commandIdRef.current,
    }

    iframeRef.current.contentWindow.postMessage(JSON.stringify(message), YOUTUBE_ORIGIN)
  }, [])

  // Player controls exposed to consumers
  const controls: YouTubePlayerControls = {
    playVideo: useCallback(() => sendCommand("playVideo"), [sendCommand]),
    pauseVideo: useCallback(() => sendCommand("pauseVideo"), [sendCommand]),
    seekTo: useCallback((seconds: number, allowSeekAhead = true) => {
      sendCommand("seekTo", [seconds, allowSeekAhead])
      currentTimeRef.current = seconds
      setCurrentTime(seconds)
    }, [sendCommand]),
    mute: useCallback(() => sendCommand("mute"), [sendCommand]),
    unMute: useCallback(() => sendCommand("unMute"), [sendCommand]),
    setVolume: useCallback((volume: number) => sendCommand("setVolume", [volume]), [sendCommand]),
    getCurrentTime: useCallback(() => currentTimeRef.current, []),
    getDuration: useCallback(() => durationRef.current, []),
    getPlayerState: useCallback(() => playerStateRef.current, []),
  }

  // Handle incoming messages from YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: only accept messages from YouTube
      if (event.origin !== YOUTUBE_ORIGIN) return

      let data: YouTubeEvent
      try {
        // YouTube sends data as JSON string
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
      } catch {
        // Not a valid JSON message, ignore
        return
      }

      if (!data || !data.event) return

      switch (data.event) {
        case "onReady":
          isReadyRef.current = true
          setIsReady(true)

          // Apply initial time if provided
          if (initialTime > 0 && !initialTimeAppliedRef.current) {
            initialTimeAppliedRef.current = true
            sendCommand("seekTo", [initialTime, true])
            currentTimeRef.current = initialTime
            setCurrentTime(initialTime)
          }

          onReady?.()
          break

        case "onStateChange":
          const state = data.info as YouTubePlayerStateValue
          playerStateRef.current = state
          setPlayerState(state)
          onStateChange?.(state)
          break

        case "initialDelivery":
        case "infoDelivery":
          const info = data.info as YouTubeInfoDelivery
          if (info) {
            // Update current time
            if (typeof info.currentTime === "number") {
              currentTimeRef.current = info.currentTime
              setCurrentTime(info.currentTime)
              onTimeUpdate?.(info.currentTime)
            }

            // Update duration
            if (typeof info.duration === "number" && info.duration > 0) {
              durationRef.current = info.duration
              setDuration(info.duration)
            }

            // Update player state from infoDelivery
            if (typeof info.playerState === "number") {
              playerStateRef.current = info.playerState
              setPlayerState(info.playerState)
            }
          }
          break

        case "onError":
          const errorCode = data.info as number
          console.error("YouTube Player Error:", errorCode)
          onError?.(errorCode)
          break
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [initialTime, sendCommand, onReady, onStateChange, onError, onTimeUpdate])

  // Initialize listening when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      // Small delay to ensure iframe is fully initialized
      setTimeout(() => {
        initializeListening()
      }, 100)
    }

    iframe.addEventListener("load", handleLoad)

    // If iframe is already loaded, initialize immediately
    if (iframe.contentWindow) {
      handleLoad()
    }

    return () => iframe.removeEventListener("load", handleLoad)
  }, [initializeListening, videoId])

  // Reset state when videoId changes
  useEffect(() => {
    setIsReady(false)
    setCurrentTime(0)
    setDuration(0)
    setPlayerState(YouTubePlayerState.UNSTARTED)
    isReadyRef.current = false
    currentTimeRef.current = 0
    durationRef.current = 0
    playerStateRef.current = YouTubePlayerState.UNSTARTED
    initialTimeAppliedRef.current = false
  }, [videoId])

  return {
    iframeRef,
    isReady,
    currentTime,
    duration,
    playerState,
    controls,
  }
}

// Utility function to build YouTube embed URL with postMessage support
export function buildYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean
    origin?: string
  } = {}
): string {
  const { autoplay = false, origin = typeof window !== "undefined" ? window.location.origin : "" } = options

  const params = new URLSearchParams({
    enablejsapi: "1",
    origin,
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    autoplay: autoplay ? "1" : "0",
  })

  return `${YOUTUBE_ORIGIN}/embed/${videoId}?${params.toString()}`
}
