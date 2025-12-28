import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock watched actions
vi.mock("@/actions/watched", () => ({
  markAsWatched: vi.fn(),
}));

import {
  addToHistory,
  updateProgress,
  getHistory,
  searchHistory,
  removeFromHistory,
  clearHistory,
  getHistoryCount,
  getVideoProgress,
} from "@/actions/history";

describe("actions/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToHistory", () => {
    it("creates a new history entry", async () => {
      const mockEntry = {
        id: 1,
        videoId: "abc123def45",
        title: "Test Video",
        thumbnail: "https://example.com/thumb.jpg",
        channelId: "channel123",
        channelName: "Test Channel",
        duration: 300,
        watchedAt: new Date(),
        progress: null,
        completed: false,
      };

      prismaMock.watchHistory.create.mockResolvedValue(mockEntry);

      const result = await addToHistory("abc123def45", {
        title: "Test Video",
        thumbnail: "https://example.com/thumb.jpg",
        channelId: "channel123",
        channelName: "Test Channel",
        duration: 300,
      });

      expect(result).toBe(1);
      expect(prismaMock.watchHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          videoId: "abc123def45",
          title: "Test Video",
          thumbnail: "https://example.com/thumb.jpg",
          channelId: "channel123",
          channelName: "Test Channel",
          duration: 300,
        }),
      });
    });

    it("handles null duration", async () => {
      const mockEntry = {
        id: 2,
        videoId: "xyz789abc12",
        title: "Video Without Duration",
        thumbnail: "https://example.com/thumb2.jpg",
        channelId: "channel456",
        channelName: "Another Channel",
        duration: null,
        watchedAt: new Date(),
        progress: null,
        completed: false,
      };

      prismaMock.watchHistory.create.mockResolvedValue(mockEntry);

      const result = await addToHistory("xyz789abc12", {
        title: "Video Without Duration",
        thumbnail: "https://example.com/thumb2.jpg",
        channelId: "channel456",
        channelName: "Another Channel",
      });

      expect(result).toBe(2);
      expect(prismaMock.watchHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          duration: null,
        }),
      });
    });
  });

  describe("updateProgress", () => {
    it("updates progress and marks as not completed when below 90%", async () => {
      prismaMock.watchHistory.update.mockResolvedValue({
        videoId: "abc123def45",
        completed: false,
      });

      await updateProgress(1, 100, 300); // 33% progress

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { progress: 100, completed: false },
        select: { videoId: true, completed: true },
      });
    });

    it("marks as completed when progress is 90% or more and auto-syncs WatchedVideo", async () => {
      const { markAsWatched } = await import("@/actions/watched");
      prismaMock.watchHistory.update.mockResolvedValue({
        videoId: "abc123def45",
        completed: true,
      });

      await updateProgress(1, 270, 300); // 90% progress

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { progress: 270, completed: true },
        select: { videoId: true, completed: true },
      });
      expect(markAsWatched).toHaveBeenCalledWith("abc123def45");
    });

    it("handles zero duration", async () => {
      prismaMock.watchHistory.update.mockResolvedValue({
        videoId: "abc123def45",
        completed: false,
      });

      await updateProgress(1, 100, 0);

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { progress: 100, completed: false },
        select: { videoId: true, completed: true },
      });
    });
  });

  describe("getHistory", () => {
    it("returns paginated history entries", async () => {
      const mockEntries = [
        {
          id: 1,
          videoId: "video1",
          title: "Video 1",
          thumbnail: "thumb1.jpg",
          channelId: "ch1",
          channelName: "Channel 1",
          duration: 300,
          watchedAt: new Date(),
          progress: 150,
          completed: false,
        },
      ];

      prismaMock.watchHistory.findMany
        .mockResolvedValueOnce(mockEntries)
        .mockResolvedValueOnce([{ videoId: "video1" }]);

      const result = await getHistory(1);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].videoId).toBe("video1");
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(1);
    });

    it("applies search filter with deletedAt null", async () => {
      prismaMock.watchHistory.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getHistory(1, "test search");

      expect(prismaMock.watchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            OR: [
              { title: { contains: "test search" } },
              { channelName: { contains: "test search" } },
            ],
          },
        })
      );
    });
  });

  describe("searchHistory", () => {
    it("searches by title and channel name with deletedAt filter", async () => {
      const mockEntries = [
        {
          id: 1,
          videoId: "video1",
          title: "Matching Title",
          thumbnail: "thumb1.jpg",
          channelId: "ch1",
          channelName: "Channel",
          duration: 300,
          watchedAt: new Date(),
          progress: null,
          completed: false,
        },
      ];

      prismaMock.watchHistory.findMany.mockResolvedValue(mockEntries);

      const result = await searchHistory("Matching");

      expect(result).toHaveLength(1);
      expect(prismaMock.watchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            OR: [
              { title: { contains: "Matching" } },
              { channelName: { contains: "Matching" } },
            ],
          },
          take: 50,
        })
      );
    });
  });

  describe("removeFromHistory", () => {
    it("soft deletes history entry by setting deletedAt", async () => {
      prismaMock.watchHistory.update.mockResolvedValue({});

      await removeFromHistory(1);

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("clearHistory", () => {
    it("soft deletes all visible history entries", async () => {
      prismaMock.watchHistory.updateMany.mockResolvedValue({ count: 10 });

      await clearHistory();

      expect(prismaMock.watchHistory.updateMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("getHistoryCount", () => {
    it("returns count of unique non-deleted videos", async () => {
      prismaMock.watchHistory.findMany.mockResolvedValue([
        { videoId: "v1" },
        { videoId: "v2" },
        { videoId: "v3" },
      ]);

      const count = await getHistoryCount();

      expect(count).toBe(3);
      expect(prismaMock.watchHistory.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        distinct: ["videoId"],
        select: { videoId: true },
      });
    });
  });

  describe("getVideoProgress", () => {
    it("returns progress for existing non-deleted video", async () => {
      prismaMock.watchHistory.findFirst.mockResolvedValue({
        id: 1,
        progress: 150,
        duration: 300,
        completed: false,
      });

      const result = await getVideoProgress("video123");

      expect(result).toEqual({
        historyId: 1,
        progress: 150,
        duration: 300,
        completed: false,
      });
      expect(prismaMock.watchHistory.findFirst).toHaveBeenCalledWith({
        where: { videoId: "video123", deletedAt: null },
        orderBy: { watchedAt: "desc" },
        select: {
          id: true,
          progress: true,
          duration: true,
          completed: true,
        },
      });
    });

    it("returns null when no progress exists", async () => {
      prismaMock.watchHistory.findFirst.mockResolvedValue(null);

      const result = await getVideoProgress("nonexistent");

      expect(result).toBeNull();
    });

    it("returns null when progress is zero or null", async () => {
      prismaMock.watchHistory.findFirst.mockResolvedValue({
        id: 1,
        progress: 0,
        duration: 300,
        completed: false,
      });

      const result = await getVideoProgress("video123");

      expect(result).toBeNull();
    });
  });
});
