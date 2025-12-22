"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ConditionalHeaderProps {
  children: ReactNode;
}

/**
 * Conditionally renders header based on current route
 * Hidden on auth pages like /login
 */
export function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname();

  // Hide header on login page
  if (pathname === "/login") {
    return null;
  }

  return <>{children}</>;
}
