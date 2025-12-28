"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

interface ConditionalMainProps {
  children: ReactNode;
}

/**
 * Conditionally wraps content in main container based on route
 * On auth pages like /login, renders children without wrapper
 * Also handles scroll to top on route changes
 */
export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Scroll to top on route change (but not on initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  // On login page, render children directly without wrapper
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // On watch pages, don't add bottom padding (full screen video)
  const isWatchPage = pathname.startsWith("/watch");

  return (
    <main
      id="main-content"
      className={`max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[calc(100vh-4rem)] safe-bottom ${
        isWatchPage ? "" : "pb-24 md:pb-8"
      }`}
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
