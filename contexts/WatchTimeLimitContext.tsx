"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode
} from "react"
import { getWatchTimeStatus, type WatchTimeStatus } from "@/actions/settings"

interface WatchTimeLimitContextType {
  status: WatchTimeStatus | null
  isLoading: boolean
  refresh: () => Promise<void>
  hasLimitsConfigured: boolean
  showWarningToast: boolean
  setShowWarningToast: (show: boolean) => void
  showLimitModal: boolean
  setShowLimitModal: (show: boolean) => void
  acknowledgedWarning: boolean
  setAcknowledgedWarning: (ack: boolean) => void
  acknowledgedLimit: boolean
  setAcknowledgedLimit: (ack: boolean) => void
}

const WatchTimeLimitContext = createContext<WatchTimeLimitContextType | null>(null)

// Refresh interval in milliseconds (1 minute)
const REFRESH_INTERVAL = 60000

export function WatchTimeLimitProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WatchTimeStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWarningToast, setShowWarningToast] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false)
  const [acknowledgedLimit, setAcknowledgedLimit] = useState(false)

  // Track the last warning/limit state to only trigger once per threshold crossing
  const [lastDailyPercentage, setLastDailyPercentage] = useState<number | null>(null)
  const [lastWeeklyPercentage, setLastWeeklyPercentage] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    try {
      const newStatus = await getWatchTimeStatus()
      setStatus(newStatus)

      // Check if we crossed warning threshold (80%)
      const crossedDailyWarning =
        newStatus.isDailyWarning &&
        (lastDailyPercentage === null || lastDailyPercentage < 80) &&
        !acknowledgedWarning

      const crossedWeeklyWarning =
        newStatus.isWeeklyWarning &&
        (lastWeeklyPercentage === null || lastWeeklyPercentage < 80) &&
        !acknowledgedWarning

      if (crossedDailyWarning || crossedWeeklyWarning) {
        setShowWarningToast(true)
      }

      // Check if we crossed limit threshold (100%)
      const crossedDailyLimit =
        newStatus.isDailyExceeded &&
        (lastDailyPercentage === null || lastDailyPercentage < 100) &&
        !acknowledgedLimit

      const crossedWeeklyLimit =
        newStatus.isWeeklyExceeded &&
        (lastWeeklyPercentage === null || lastWeeklyPercentage < 100) &&
        !acknowledgedLimit

      if (crossedDailyLimit || crossedWeeklyLimit) {
        setShowLimitModal(true)
      }

      // Update last percentages
      setLastDailyPercentage(newStatus.dailyPercentage)
      setLastWeeklyPercentage(newStatus.weeklyPercentage)
    } catch (error) {
      console.error("Failed to fetch watch time status:", error)
    } finally {
      setIsLoading(false)
    }
  }, [lastDailyPercentage, lastWeeklyPercentage, acknowledgedWarning, acknowledgedLimit])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic refresh only when limits are configured
  useEffect(() => {
    if (!status) return

    const hasLimits = status.dailyLimit !== null || status.weeklyLimit !== null
    if (!hasLimits) return

    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [status, refresh])

  // Reset acknowledgments at midnight (daily) and Monday (weekly)
  useEffect(() => {
    const checkReset = () => {
      const now = new Date()

      // Reset daily acknowledgment at midnight
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setAcknowledgedWarning(false)
        setAcknowledgedLimit(false)
        setLastDailyPercentage(null)
      }

      // Reset weekly acknowledgment on Monday at midnight
      if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
        setLastWeeklyPercentage(null)
      }
    }

    // Check every minute
    const interval = setInterval(checkReset, 60000)
    return () => clearInterval(interval)
  }, [])

  const hasLimitsConfigured =
    status !== null &&
    (status.dailyLimit !== null || status.weeklyLimit !== null)

  return (
    <WatchTimeLimitContext.Provider
      value={{
        status,
        isLoading,
        refresh,
        hasLimitsConfigured,
        showWarningToast,
        setShowWarningToast,
        showLimitModal,
        setShowLimitModal,
        acknowledgedWarning,
        setAcknowledgedWarning,
        acknowledgedLimit,
        setAcknowledgedLimit
      }}
    >
      {children}
    </WatchTimeLimitContext.Provider>
  )
}

export function useWatchTimeLimit() {
  const context = useContext(WatchTimeLimitContext)
  if (!context) {
    throw new Error("useWatchTimeLimit must be used within a WatchTimeLimitProvider")
  }
  return context
}
