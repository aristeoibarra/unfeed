Loaded Prisma config from prisma.config.ts.

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER,
    CONSTRAINT "Subscription_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchedVideo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WatchLater" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VideoNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "duration" INTEGER,
    "description" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "viewCount" INTEGER,
    "likeCount" INTEGER,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SyncStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SyncStatus_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Subscription" ("channelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "duration" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME
);

-- CreateTable
CREATE TABLE "VideoReaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hideDislikedFromFeed" BOOLEAN NOT NULL DEFAULT true,
    "dailyLimitMinutes" INTEGER,
    "weeklyLimitMinutes" INTEGER,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'es',
    "autoShowSubtitles" BOOLEAN NOT NULL DEFAULT false,
    "syncIntervalHours" INTEGER NOT NULL DEFAULT 6
);

-- CreateTable
CREATE TABLE "WatchHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "duration" INTEGER,
    "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlaylistVideo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playlistId" INTEGER NOT NULL,
    "videoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "duration" INTEGER,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaylistVideo_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AudioCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AudioFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPlayedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "channelsSynced" INTEGER NOT NULL,
    "newVideos" INTEGER NOT NULL,
    "apiUnitsUsed" INTEGER NOT NULL,
    "errors" TEXT,
    "duration" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_channelId_key" ON "Subscription"("channelId");

-- CreateIndex
CREATE INDEX "Subscription_categoryId_idx" ON "Subscription"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchedVideo_videoId_key" ON "WatchedVideo"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchLater_videoId_key" ON "WatchLater"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoNote_videoId_key" ON "VideoNote"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoId_key" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_channelId_idx" ON "Video"("channelId");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Video_duration_idx" ON "Video"("duration");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_channelId_key" ON "SyncStatus"("channelId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "VideoReaction_videoId_key" ON "VideoReaction"("videoId");

-- CreateIndex
CREATE INDEX "VideoReaction_type_idx" ON "VideoReaction"("type");

-- CreateIndex
CREATE INDEX "WatchHistory_videoId_idx" ON "WatchHistory"("videoId");

-- CreateIndex
CREATE INDEX "WatchHistory_watchedAt_idx" ON "WatchHistory"("watchedAt" DESC);

-- CreateIndex
CREATE INDEX "WatchHistory_deletedAt_idx" ON "WatchHistory"("deletedAt");

-- CreateIndex
CREATE INDEX "PlaylistVideo_playlistId_idx" ON "PlaylistVideo"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistVideo_position_idx" ON "PlaylistVideo"("position");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistVideo_playlistId_videoId_key" ON "PlaylistVideo"("playlistId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioCache_videoId_key" ON "AudioCache"("videoId");

-- CreateIndex
CREATE INDEX "AudioCache_expiresAt_idx" ON "AudioCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AudioFile_videoId_key" ON "AudioFile"("videoId");

-- CreateIndex
CREATE INDEX "AudioFile_lastPlayedAt_idx" ON "AudioFile"("lastPlayedAt");

-- CreateIndex
CREATE INDEX "AudioFile_status_idx" ON "AudioFile"("status");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt" DESC);

