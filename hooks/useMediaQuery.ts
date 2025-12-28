import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  // Default to true (desktop) to match SSR and avoid hydration flash
  // This means on mobile, there will be a brief flash from desktop to mobile UI
  // But since we're a PWA primarily used on desktop, this is acceptable
  const [matches, setMatches] = useState(() => {
    // During SSR, default to desktop (true for min-width queries)
    if (typeof window === "undefined") {
      return true
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value (handles SSR mismatch)
    setMatches(media.matches)

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener("change", listener)

    // Cleanup
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
