import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getUnreadCount, getRecentNotifications } from "@/actions/notifications";
import { getSession } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileNav } from "@/components/MobileNav";
import { DesktopNav } from "@/components/DesktopNav";
import { VideoSearch } from "@/components/VideoSearch";
import { UserMenu } from "@/components/UserMenu";
import { Providers } from "@/components/Providers";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { ConditionalMain } from "@/components/ConditionalMain";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Unfeed";
const APP_DESCRIPTION = "YouTube sin distracciones";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [unreadCount, recentNotifications, session] = await Promise.all([
    getUnreadCount(),
    getRecentNotifications(5),
    getSession()
  ]);

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Providers>
          <TooltipProvider delayDuration={300}>
            {/* Skip to main content link for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
            >
              Skip to main content
            </a>

            {/* Header - Fixed with safe area insets for PWA */}
            <ConditionalHeader>
              <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 safe-top">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                  {/* Left: Mobile menu + Logo */}
                  <div className="flex items-center gap-3">
                    <MobileNav />
                    <Link
                      href="/"
                      className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
                      aria-label="Unfeed - Go to home"
                    >
                      Unfeed
                    </Link>
                  </div>

                  {/* Center: Desktop navigation */}
                  <DesktopNav />

                  {/* Right: Search + Notifications + Logout */}
                  <div className="flex items-center gap-2">
                    <VideoSearch />
                    <NotificationBell
                      initialCount={unreadCount}
                      initialNotifications={recentNotifications}
                    />
                    {session && (
                      <UserMenu email={session.email} />
                    )}
                  </div>
                </div>
              </header>
            </ConditionalHeader>

            {/* Main content */}
            <ConditionalMain>
              {children}
            </ConditionalMain>

            {/* Toast notifications */}
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
