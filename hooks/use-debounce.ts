import { useState, useEffect } from "react"

/**
 * Custom hook for debouncing values
 *
 * TDA-friendly considerations:
 * - 300ms default delay balances responsiveness with avoiding overwhelming API calls
 * - Prevents search from firing on every keystroke
 * - Reduces visual noise from rapid result changes
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
