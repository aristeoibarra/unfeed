"use client"

import { PlayerProvider } from "@/contexts/PlayerContext"
import { MiniPlayer } from "./MiniPlayer"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <MiniPlayer />
    </PlayerProvider>
  )
}
