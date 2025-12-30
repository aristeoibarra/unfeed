"use client"

import { ThemeProvider } from "next-themes"
import { PlayerProvider } from "@/contexts/PlayerContext"
import { WatchTimeLimitProvider } from "@/contexts/WatchTimeLimitContext"
import { MiniPlayer } from "./MiniPlayer"
import { WatchTimeWarning } from "./WatchTimeWarning"
import { LimitReachedModal } from "./LimitReachedModal"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <PlayerProvider>
        <WatchTimeLimitProvider>
          {children}
          <MiniPlayer />
          <WatchTimeWarning />
          <LimitReachedModal />
        </WatchTimeLimitProvider>
      </PlayerProvider>
    </ThemeProvider>
  )
}
