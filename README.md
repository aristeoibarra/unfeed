# Unfeed

Personal YouTube focused on educational content, without distractions.

## Problem

- YouTube is designed to maximize engagement (algorithm, autoplay, shorts)
- For people with ADHD/procrastination, it's a trap
- Blocking YouTube completely removes useful educational content

## Solution

A local web application that:
- Shows only videos from channels YOU choose (whitelist)
- No recommendation algorithm
- No autoplay
- No shorts
- Runs locally with `bun run dev`

## Stack

- Next.js 16 (App Router)
- Prisma 7 + SQLite
- Server Actions
- YouTube Data API v3
- Tailwind CSS

## Installation

```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your YOUTUBE_API_KEY

# Initialize database
bunx prisma generate
bunx prisma db push

# Start server
bun run dev
```

## Configure YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials > API Key
5. Copy key to `.env.local`

## Usage

1. Open http://localhost:3000
2. Go to "Channels" and add channels by URL (e.g., `https://youtube.com/@midudev`)
3. View the video feed on the home page
4. Click on a video to play it

## NextDNS Configuration (Optional)

To block regular YouTube and only allow Unfeed:

**Allowlist:**
```
youtube-nocookie.com
youtube.googleapis.com
i.ytimg.com
```

**Blocklist:**
```
youtube.com
www.youtube.com
m.youtube.com
```
