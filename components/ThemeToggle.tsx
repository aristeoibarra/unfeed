"use client"

import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-chart-4/10 rounded-lg shrink-0">
            <Moon className="h-5 w-5 text-chart-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="font-medium">Dark mode</div>
            <p className="text-sm text-muted-foreground">
              Use dark theme for the interface
            </p>
          </div>
        </div>
        <div className="shrink-0 ml-3">
          <Switch disabled />
        </div>
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-chart-4/10 rounded-lg shrink-0">
          {isDark ? (
            <Moon className="h-5 w-5 text-chart-4" aria-hidden="true" />
          ) : (
            <Sun className="h-5 w-5 text-chart-4" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <label
            htmlFor="theme-toggle"
            className="font-medium cursor-pointer"
          >
            Dark mode
          </label>
          <p className="text-sm text-muted-foreground">
            Use dark theme for the interface
          </p>
        </div>
      </div>
      <div className="shrink-0 ml-3">
        <Switch
          id="theme-toggle"
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          aria-describedby="theme-toggle-desc"
        />
      </div>
    </div>
  )
}
