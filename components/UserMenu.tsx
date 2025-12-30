"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface UserMenuProps {
  email: string
}

function UserAvatar({ initial, size = "default" }: { initial: string; size?: "default" | "small" }) {
  const sizeClasses = size === "small" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"
  return (
    <Avatar className={`${sizeClasses} cursor-pointer`}>
      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    }

    router.push("/login")
    router.refresh()
  }

  const initial = email.charAt(0).toUpperCase()

  const menuButton = (
    <button
      className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 transition-transform duration-150 hover:scale-105 active:scale-95"
      aria-label={`User menu for ${email}`}
    >
      <UserAvatar initial={initial} size="small" />
    </button>
  )

  const menuContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <UserAvatar initial={initial} />
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium">My account</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="flex items-center gap-3 w-full px-4 py-4 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium">
          {isLoading ? "Logging out..." : "Log out"}
        </span>
      </button>
    </>
  )

  if (isDesktop) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          {menuButton}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          aria-busy={isLoading}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">My account</p>
              <p className="text-xs text-muted-foreground truncate">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoading}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-2.5"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>{isLoading ? "Logging out..." : "Log out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {menuButton}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>User Menu</DrawerTitle>
        </DrawerHeader>
        {menuContent}
      </DrawerContent>
    </Drawer>
  )
}
