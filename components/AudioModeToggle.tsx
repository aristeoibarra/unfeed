"use client"

import { useState, useEffect } from "react"
import { getAudioUrl, isAudioModeAvailable } from "@/actions/audio"
import { usePlayer } from "@/contexts/PlayerContext"

interface AudioModeToggleProps {
  videoId: string
  video: {
    title: string
    channelName: string
    thumbnail: string
    duration?: number | null
  }
}

export function AudioModeToggle({ videoId, video }: AudioModeToggleProps) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isAudioMode, toggleAudioMode, playVideo, setAudioUrl } = usePlayer()

  useEffect(() => {
    isAudioModeAvailable().then(setIsAvailable)
  }, [])

  const handleToggle = async () => {
    if (isAudioMode) {
      toggleAudioMode()
      return
    }

    setIsLoading(true)
    try {
      const audioUrl = await getAudioUrl(videoId)
      if (audioUrl) {
        setAudioUrl(audioUrl)
        playVideo({
          videoId,
          title: video.title,
          channelName: video.channelName,
          thumbnail: video.thumbnail,
          duration: video.duration,
        })
        toggleAudioMode()
      } else {
        // Audio URL not available - show message
        alert("El modo de audio no esta disponible. Se requiere configurar el backend.")
      }
    } catch (error) {
      console.error("Error activating audio mode:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if backend not configured
  if (!isAvailable) {
    return null
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-sm">Modo Solo Audio</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Escucha en segundo plano ahorrando datos
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isAudioMode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          } disabled:opacity-50`}
        >
          {isLoading ? "Cargando..." : isAudioMode ? "Activado" : "Activar"}
        </button>
      </div>
    </div>
  )
}
