import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getWatchLater,
  getWatchLaterIds,
  isInWatchLater,
  addToWatchLater,
  removeFromWatchLater,
  toggleWatchLater,
} from "@/actions/watch-later";

describe("actions/watch-later", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockVideo = {
    videoId: "abc123def45",
    title: "Test Video",
    thumbnail: "https://example.com/thumb.jpg",
    channelId: "channel123",
    channelName: "Test Channel",
  };

  describe("getWatchLater", () => {
    it("returns all watch later items ordered by date", async () => {
      const mockItems = [
        { ...mockVideo, id: 1, addedAt: new Date() },
        { ...mockVideo, videoId: "xyz789abc12", id: 2, addedAt: new Date() },
      ];

      prismaMock.watchLater.findMany.mockResolvedValue(mockItems);

      const result = await getWatchLater();

      expect(result).toHaveLength(2);
      expect(prismaMock.watchLater.findMany).toHaveBeenCalledWith({
        orderBy: { addedAt: "desc" },
      });
    });
  });

  describe("getWatchLaterIds", () => {
    it("returns array of video IDs", async () => {
      prismaMock.watchLater.findMany.mockResolvedValue([
        { videoId: "video1video1" },
        { videoId: "video2video2" },
      ]);

      const result = await getWatchLaterIds();

      expect(result).toEqual(["video1video1", "video2video2"]);
    });
  });

  describe("isInWatchLater", () => {
    it("returns true when video is in watch later", async () => {
      prismaMock.watchLater.findUnique.mockResolvedValue(mockVideo);

      const result = await isInWatchLater("abc123def45");

      expect(result).toBe(true);
    });

    it("returns false when video is not in watch later", async () => {
      prismaMock.watchLater.findUnique.mockResolvedValue(null);

      const result = await isInWatchLater("abc123def45");

      expect(result).toBe(false);
    });

    it("returns false for invalid video ID", async () => {
      const result = await isInWatchLater("invalid");

      expect(result).toBe(false);
      expect(prismaMock.watchLater.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("addToWatchLater", () => {
    it("adds video to watch later list", async () => {
      prismaMock.watchLater.upsert.mockResolvedValue({});

      await addToWatchLater(mockVideo);

      expect(prismaMock.watchLater.upsert).toHaveBeenCalledWith({
        where: { videoId: mockVideo.videoId },
        update: {},
        create: expect.objectContaining({
          videoId: mockVideo.videoId,
          title: mockVideo.title,
          thumbnail: mockVideo.thumbnail,
          channelId: mockVideo.channelId,
          channelName: mockVideo.channelName,
        }),
      });
    });

    it("throws error for invalid video ID", async () => {
      await expect(
        addToWatchLater({ ...mockVideo, videoId: "invalid" })
      ).rejects.toThrow("Invalid video ID");
    });

    it("truncates long titles", async () => {
      const longTitle = "A".repeat(600);
      prismaMock.watchLater.upsert.mockResolvedValue({});

      await addToWatchLater({ ...mockVideo, title: longTitle });

      expect(prismaMock.watchLater.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            title: "A".repeat(500),
          }),
        })
      );
    });
  });

  describe("removeFromWatchLater", () => {
    it("removes video from watch later list", async () => {
      prismaMock.watchLater.delete.mockResolvedValue({});

      await removeFromWatchLater("abc123def45");

      expect(prismaMock.watchLater.delete).toHaveBeenCalledWith({
        where: { videoId: "abc123def45" },
      });
    });

    it("does not throw for invalid video ID", async () => {
      await expect(removeFromWatchLater("invalid")).resolves.not.toThrow();
    });

    it("does not throw when video is not in list", async () => {
      prismaMock.watchLater.delete.mockRejectedValue(new Error("Not found"));

      await expect(
        removeFromWatchLater("abc123def45")
      ).resolves.not.toThrow();
    });
  });

  describe("toggleWatchLater", () => {
    it("adds video when not in list and returns true", async () => {
      prismaMock.watchLater.findUnique.mockResolvedValue(null);
      prismaMock.watchLater.upsert.mockResolvedValue({});

      const result = await toggleWatchLater(mockVideo);

      expect(result).toBe(true);
      expect(prismaMock.watchLater.upsert).toHaveBeenCalled();
    });

    it("removes video when in list and returns false", async () => {
      prismaMock.watchLater.findUnique.mockResolvedValue(mockVideo);
      prismaMock.watchLater.delete.mockResolvedValue({});

      const result = await toggleWatchLater(mockVideo);

      expect(result).toBe(false);
      expect(prismaMock.watchLater.delete).toHaveBeenCalled();
    });
  });
});
