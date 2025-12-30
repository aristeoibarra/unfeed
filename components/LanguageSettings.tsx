"use client"

import { useState } from "react"
import { updateSettings } from "@/actions/settings"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Languages, Loader2, Captions } from "lucide-react"
import { cn } from "@/lib/utils"

interface LanguageSettingsProps {
  initialLanguage: "es" | "en"
  initialAutoShowSubtitles: boolean
}

const languages = [
  { code: "es", label: "Espanol" },
  { code: "en", label: "English" },
] as const

export function LanguageSettings({
  initialLanguage,
  initialAutoShowSubtitles,
}: LanguageSettingsProps) {
  const { toast } = useToast()
  const [language, setLanguage] = useState<"es" | "en">(initialLanguage)
  const [autoShowSubtitles, setAutoShowSubtitles] = useState(initialAutoShowSubtitles)
  const [loadingLanguage, setLoadingLanguage] = useState(false)
  const [loadingSubtitles, setLoadingSubtitles] = useState(false)

  async function handleLanguageChange(newLanguage: "es" | "en") {
    if (newLanguage === language) return

    setLoadingLanguage(true)
    const previousLanguage = language
    setLanguage(newLanguage)

    try {
      await updateSettings({ preferredLanguage: newLanguage })
      toast({
        title: "Language updated",
        description: `YouTube player will now display in ${newLanguage === "es" ? "Spanish" : "English"}.`,
      })
    } catch {
      setLanguage(previousLanguage)
      toast({
        title: "Failed to update language",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingLanguage(false)
    }
  }

  async function handleSubtitlesToggle(checked: boolean) {
    setLoadingSubtitles(true)
    setAutoShowSubtitles(checked)

    try {
      await updateSettings({ autoShowSubtitles: checked })
      toast({
        title: checked ? "Subtitles enabled" : "Subtitles disabled",
        description: checked
          ? "Subtitles will be shown automatically when available."
          : "Subtitles will not be shown automatically.",
      })
    } catch {
      setAutoShowSubtitles(!checked)
      toast({
        title: "Failed to update settings",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingSubtitles(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Language selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Languages className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">Player language</p>
            <p className="text-sm text-muted-foreground">
              YouTube interface and subtitle preference
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11 sm:ml-0">
          {loadingLanguage && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          )}
          <div className="flex rounded-lg border border-border p-1">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="ghost"
                size="sm"
                onClick={() => handleLanguageChange(lang.code)}
                disabled={loadingLanguage}
                className={cn(
                  "px-3 py-1 h-8 rounded-md transition-colors",
                  language === lang.code
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted"
                )}
                aria-pressed={language === lang.code}
              >
                {lang.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtitles toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-success/10 rounded-lg shrink-0">
            <Captions className="h-5 w-5 text-success" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <label htmlFor="auto-subtitles" className="font-medium cursor-pointer">
              Show subtitles automatically
            </label>
            <p className="text-sm text-muted-foreground">
              Display subtitles when starting a video
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {loadingSubtitles && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          )}
          <Switch
            id="auto-subtitles"
            checked={autoShowSubtitles}
            onCheckedChange={handleSubtitlesToggle}
            disabled={loadingSubtitles}
          />
        </div>
      </div>
    </div>
  )
}
