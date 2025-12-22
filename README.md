# Unfeed

YouTube without distractions. A personal web application focused on educational content.

## Problem

- YouTube is designed to maximize engagement (algorithm, autoplay, shorts)
- For people with ADHD/procrastination, it's a trap
- Blocking YouTube completely removes useful educational content

## Solution

A web application that:

- Shows only videos from channels YOU choose (whitelist)
- No recommendation algorithm
- No autoplay
- No shorts
- Designed with accessibility for users with ADHD

## Features

- **Personalized Feed** - Only videos from your subscriptions
- **Video Search** - Search YouTube without distractions
- **Watch Later** - Save videos to watch later
- **History** - Record of watched videos
- **Playlists** - Organize your videos
- **Liked** - Videos you liked
- **Audio Mode** - Listen to videos as podcasts
- **Notifications** - Alerts for new videos
- **PWA** - Install as native app
- **Authentication** - Private access

## Stack

- Next.js 15 (App Router)
- Prisma + SQLite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zod (validation)
- YouTube Data API v3

## Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Required for Audio Mode

```bash
# Install yt-dlp (macOS)
brew install yt-dlp

# Install yt-dlp (Linux)
sudo apt install yt-dlp

# Install yt-dlp (Windows)
winget install yt-dlp
```

## Installation

```bash
# Clone repository
git clone https://github.com/your-username/unfeed.git
cd unfeed

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
bunx prisma generate
bunx prisma db push

# Start development server
bun run dev
```

## Environment Variables

```env
YOUTUBE_API_KEY=your_youtube_api_key
AUTH_SECRET=your_session_secret
AUTH_EMAIL=your@email.com
AUTH_PASSWORD_HASH=your_password_hash
CRON_SECRET=your_cron_secret_for_sync
```

## Configure YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials > API Key
5. Copy the key to `.env.local`

## Usage

1. Open http://localhost:3000
2. Login with your credentials
3. Go to "Subscriptions" and add channels by URL
4. View the video feed on the home page
5. Click on a video to play it

## Scripts

```bash
bun run dev      # Development server
bun run build    # Production build
bun run start    # Start production
bun run lint     # Run linter
```

## Project Structure

```
app/
  (routes)/       # Application pages
  api/            # API routes
actions/          # Server actions
components/       # React components
lib/              # Utilities and configuration
prisma/           # Database schema
public/           # Static assets
```

## License

Private project.
