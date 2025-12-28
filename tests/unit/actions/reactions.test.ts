import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getReaction,
  getReactions,
  getLikedVideoIds,
  getDislikedVideoIds,
  setReaction,
  removeReaction,
  getLikedVideos,
} from "@/actions/reactions";

describe("actions/reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all prisma mock return values
    prismaMock.videoReaction.findUnique.mockReset();
    prismaMock.videoReaction.findMany.mockReset();
    prismaMock.videoReaction.create.mockReset();
    prismaMock.videoReaction.update.mockReset();
    prismaMock.videoReaction.delete.mockReset();
    prismaMock.videoReaction.count.mockReset();
    prismaMock.video.findMany.mockReset();
  });

  describe("getReaction", () => {
    it("returns reaction type for valid video", async () => {
      prismaMock.videoReaction.findUnique.mockResolvedValue({
        videoId: "abc123def45",
        type: "like",
      });

      const result = await getReaction("abc123def45");

      expect(result).toBe("like");
    });

    it("returns null for video without reaction", async () => {
      prismaMock.videoReaction.findUnique.mockResolvedValueOnce(null);

      const result = await getReaction("abc123def45");

      // When no reaction exists, result should be null or undefined (both are falsy)
      expect(result).toBeFalsy();
      expect(prismaMock.videoReaction.findUnique).toHaveBeenCalledWith({
        where: { videoId: "abc123def45" },
      });
    });

    it("returns null for invalid video ID format", async () => {
      const result = await getReaction("invalid");

      expect(result).toBeNull();
      expect(prismaMock.videoReaction.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("getReactions", () => {
    it("returns map of reactions for multiple videos", async () => {
      prismaMock.videoReaction.findMany.mockResolvedValue([
        { videoId: "video1video1", type: "like" },
        { videoId: "video2video2", type: "dislike" },
      ]);

      const result = await getReactions(["video1video1", "video2video2"]);

      expect(result.get("video1video1")).toBe("like");
      expect(result.get("video2video2")).toBe("dislike");
    });

    it("returns empty map when no reactions exist", async () => {
      prismaMock.videoReaction.findMany.mockResolvedValue([]);

      const result = await getReactions(["video1video1"]);

      expect(result.size).toBe(0);
    });
  });

  describe("getLikedVideoIds", () => {
    it("returns array of liked video IDs", async () => {
      prismaMock.videoReaction.findMany.mockResolvedValue([
        { videoId: "video1video1" },
        { videoId: "video2video2" },
      ]);

      const result = await getLikedVideoIds();

      expect(result).toEqual(["video1video1", "video2video2"]);
      expect(prismaMock.videoReaction.findMany).toHaveBeenCalledWith({
        where: { type: "like" },
        select: { videoId: true },
      });
    });
  });

  describe("getDislikedVideoIds", () => {
    it("returns array of disliked video IDs", async () => {
      prismaMock.videoReaction.findMany.mockResolvedValue([
        { videoId: "video3video3" },
      ]);

      const result = await getDislikedVideoIds();

      expect(result).toEqual(["video3video3"]);
      expect(prismaMock.videoReaction.findMany).toHaveBeenCalledWith({
        where: { type: "dislike" },
        select: { videoId: true },
      });
    });
  });

  describe("setReaction", () => {
    it("creates new reaction when none exists", async () => {
      prismaMock.videoReaction.findUnique.mockResolvedValue(null);
      prismaMock.videoReaction.create.mockResolvedValue({});

      await setReaction("abc123def45", "like");

      expect(prismaMock.videoReaction.create).toHaveBeenCalledWith({
        data: { videoId: "abc123def45", type: "like" },
      });
    });

    it("removes reaction when same type is set again", async () => {
      prismaMock.videoReaction.findUnique.mockResolvedValue({
        videoId: "abc123def45",
        type: "like",
      });
      prismaMock.videoReaction.delete.mockResolvedValue({});

      await setReaction("abc123def45", "like");

      expect(prismaMock.videoReaction.delete).toHaveBeenCalledWith({
        where: { videoId: "abc123def45" },
      });
    });

    it("updates reaction when different type is set", async () => {
      prismaMock.videoReaction.findUnique.mockResolvedValue({
        videoId: "abc123def45",
        type: "like",
      });
      prismaMock.videoReaction.update.mockResolvedValue({});

      await setReaction("abc123def45", "dislike");

      expect(prismaMock.videoReaction.update).toHaveBeenCalledWith({
        where: { videoId: "abc123def45" },
        data: { type: "dislike" },
      });
    });

    it("throws error for invalid video ID", async () => {
      await expect(setReaction("invalid", "like")).rejects.toThrow(
        "Invalid input"
      );
    });

    it("throws error for invalid reaction type", async () => {
      await expect(
        setReaction("abc123def45", "invalid" as "like")
      ).rejects.toThrow("Invalid input");
    });
  });

  describe("removeReaction", () => {
    it("deletes existing reaction", async () => {
      prismaMock.videoReaction.delete.mockResolvedValue({});

      await removeReaction("abc123def45");

      expect(prismaMock.videoReaction.delete).toHaveBeenCalledWith({
        where: { videoId: "abc123def45" },
      });
    });

    it("does not throw when reaction does not exist", async () => {
      prismaMock.videoReaction.delete.mockRejectedValue(new Error("Not found"));

      await expect(removeReaction("abc123def45")).resolves.not.toThrow();
    });
  });

  describe("getLikedVideos", () => {
    it("returns paginated liked videos", async () => {
      prismaMock.videoReaction.findMany.mockResolvedValue([
        { videoId: "video1video1" },
      ]);
      prismaMock.video.findMany.mockResolvedValue([
        {
          videoId: "video1video1",
          title: "Liked Video",
          thumbnail: "thumb.jpg",
          channelId: "ch1",
          channelName: "Channel",
          publishedAt: new Date(),
          duration: 300,
          description: null,
          tags: null,
          category: null,
          viewCount: null,
          likeCount: null,
        },
      ]);
      prismaMock.videoReaction.count.mockResolvedValue(1);

      const result = await getLikedVideos(1, 24);

      expect(result.videos).toHaveLength(1);
      expect(result.videos[0].title).toBe("Liked Video");
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(1);
    });

    it("returns empty array when no liked videos", async () => {
      prismaMock.videoReaction.findMany.mockResolvedValue([]);

      const result = await getLikedVideos();

      expect(result.videos).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(0);
    });
  });
});
