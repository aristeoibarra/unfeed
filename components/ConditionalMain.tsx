"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ConditionalMainProps {
  children: ReactNode;
}

/**
 * Conditionally wraps content in main container based on route
 * On auth pages like /login, renders children without wrapper
 */
export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();

  // On login page, render children directly without wrapper
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <main
      id="main-content"
      className="max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[calc(100vh-4rem)] safe-bottom"
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
