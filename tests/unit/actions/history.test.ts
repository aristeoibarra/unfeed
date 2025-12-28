import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
      prismaMock.watchHistory.update.mockResolvedValue({});

      await updateProgress(1, 100, 300); // 33% progress

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { progress: 100, completed: false },
      });
    });

    it("marks as completed when progress is 90% or more", async () => {
      prismaMock.watchHistory.update.mockResolvedValue({});

      await updateProgress(1, 270, 300); // 90% progress

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { progress: 270, completed: true },
      });
    });

    it("handles zero duration", async () => {
      prismaMock.watchHistory.update.mockResolvedValue({});

      await updateProgress(1, 100, 0);

      expect(prismaMock.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { progress: 100, completed: false },
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

    it("applies search filter", async () => {
      prismaMock.watchHistory.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getHistory(1, "test search");

      expect(prismaMock.watchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
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
    it("searches by title and channel name", async () => {
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
    it("deletes history entry by id", async () => {
      prismaMock.watchHistory.delete.mockResolvedValue({});

      await removeFromHistory(1);

      expect(prismaMock.watchHistory.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("clearHistory", () => {
    it("deletes all history entries", async () => {
      prismaMock.watchHistory.deleteMany.mockResolvedValue({ count: 10 });

      await clearHistory();

      expect(prismaMock.watchHistory.deleteMany).toHaveBeenCalled();
    });
  });

  describe("getHistoryCount", () => {
    it("returns count of unique videos", async () => {
      prismaMock.watchHistory.findMany.mockResolvedValue([
        { videoId: "v1" },
        { videoId: "v2" },
        { videoId: "v3" },
      ]);

      const count = await getHistoryCount();

      expect(count).toBe(3);
    });
  });

  describe("getVideoProgress", () => {
    it("returns progress for existing video", async () => {
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
