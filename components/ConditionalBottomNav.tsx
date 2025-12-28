"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

/**
 * Conditionally renders bottom navigation based on current route
 * Hidden on auth pages like /login and video watch pages
 */
export function ConditionalBottomNav() {
  const pathname = usePathname();

  // Hide on login page and watch pages (full screen video)
  if (pathname === "/login" || pathname.startsWith("/watch")) {
    return null;
  }

  return <BottomNav />;
}
