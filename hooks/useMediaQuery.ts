import { useSyncExternalStore } from "react"

function getServerSnapshot(): boolean {
  return true // Default to desktop for SSR
}

export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener("change", callback)
    return () => media.removeEventListener("change", callback)
  }

  const getSnapshot = () => {
    return window.matchMedia(query).matches
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
