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
- **Offline Audio Cache** - Downloaded audio files for instant playback
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

### yt-dlp with Cookies (Server/Production)

For Audio Mode to work reliably in production, yt-dlp may need YouTube cookies to bypass rate limits and access restrictions.

1. **Export cookies from your browser** using an extension like [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) or similar
2. **Copy the cookies file to your server:**
   ```bash
   scp cookies.txt user@your-server:/path/to/unfeed/cookies.txt
   ```
3. **Set the environment variable:**
   ```env
   YTDLP_COOKIES_PATH=/path/to/unfeed/cookies.txt
   ```

**Important:**
- Keep cookies.txt private (it's already in .gitignore)
- Cookies expire periodically, you may need to re-export them
- Use a dedicated YouTube account for this purpose

### Offline Audio Cache

Audio files are automatically downloaded to disk when you use Audio Mode. This provides:
- **Instant playback** - No waiting for yt-dlp to extract URLs
- **Reliability** - Works even if yt-dlp temporarily fails
- **Reduced API calls** - Less load on YouTube

**Configuration:**
```env
# Directory for cached audio files
AUDIO_CACHE_DIR=./audio-cache          # Development
AUDIO_CACHE_DIR=/home/ec2-user/audio-cache  # Production (EC2)

# Maximum disk usage for audio cache (in GB)
MAX_AUDIO_CACHE_GB=5   # Development
MAX_AUDIO_CACHE_GB=50  # Production
```

**How it works:**
1. User activates Audio Mode
2. If audio file exists locally → serve instantly
3. If not → stream from YouTube while downloading in background
4. Files not played in 30+ days are automatically cleaned up

**Setup for production (EC2):**
```bash
# Create cache directory
mkdir -p /home/ec2-user/audio-cache

# Add daily cleanup cron (3 AM)
crontab -e
0 3 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/audio-cleanup
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
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Authentication
AUTH_SECRET=your_session_secret
AUTH_EMAIL=your@email.com
AUTH_PASSWORD_HASH=your_password_hash

# Cron jobs
CRON_SECRET=your_cron_secret_for_sync

# Audio Cache (Offline Mode)
AUDIO_CACHE_DIR=./audio-cache
MAX_AUDIO_CACHE_GB=5

# yt-dlp (optional, for production)
YT_DLP_PATH=/home/ec2-user/.local/bin/yt-dlp
YT_DLP_COOKIES_PATH=/home/ec2-user/cookies_youtube.txt
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
bun run tunnel   # Expose dev server to internet (for PWA testing)
```

## PWA Testing on Mobile

To test PWA features (Service Workers, install prompts, notifications) on a real Android device during development:

### Prerequisites

```bash
# Install cloudflared (once)
brew install cloudflared
```

### Usage

```bash
# Terminal 1: Run dev server
bun run dev

# Terminal 2: Expose to internet with HTTPS
bun run tunnel
```

This outputs a public URL like `https://random-words.trycloudflare.com`

### Test on Android

1. Open the URL in Chrome on your Android device
2. Install as PWA (Add to Home Screen)
3. Test features: audio mode, notifications, media controls, etc.

**Why cloudflared?**
- Free, no account required
- Provides HTTPS (required for PWA features)
- Fast (Cloudflare edge network)

## Project Structure

```
app/
  (routes)/       # Application pages
  api/            # API routes
    audio/        # Audio streaming and file serving
    cron/         # Scheduled tasks (sync, audio-cleanup)
actions/          # Server actions
components/       # React components
lib/              # Utilities and configuration
  audio-cache.ts  # Offline audio download logic
prisma/           # Database schema
public/           # Static assets
audio-cache/      # Downloaded audio files (gitignored)
```

## License

Private project.
