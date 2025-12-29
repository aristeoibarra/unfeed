"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Heart, Menu, Clock, BarChart3, BookmarkCheck, ListVideo, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const mainNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/channels", label: "Channels", icon: Users },
  { href: "/liked", label: "Liked", icon: Heart },
]

const moreNavItems = [
  { href: "/history", label: "History", icon: Clock },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/watch-later", label: "Watch Later", icon: BookmarkCheck },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isMoreActive = moreNavItems.some(item =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 safe-bottom"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-3 py-2 rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                "active:scale-95 transition-transform duration-100",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isActive && "stroke-[2.5px]"
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* More menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-3 py-2 rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                "active:scale-95 transition-transform duration-100",
                isMoreActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
              aria-label="More options"
            >
              <Menu
                className={cn(
                  "h-6 w-6 transition-colors",
                  isMoreActive && "stroke-[2.5px]"
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">
                More
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 pb-6">
              {moreNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                      "active:scale-95 transition-transform duration-100",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
