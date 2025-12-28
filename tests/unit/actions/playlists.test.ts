import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getPlaylists,
  getPlaylist,
  getPlaylistsForVideo,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  toggleVideoInPlaylist,
  getPlaylistsWithVideoStatus,
} from "@/actions/playlists";

describe("actions/playlists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockVideo = {
    videoId: "abc123def45",
    title: "Test Video",
    thumbnail: "https://example.com/thumb.jpg",
    channelId: "channel123",
    channelName: "Test Channel",
    duration: 300,
  };

  describe("getPlaylists", () => {
    it("returns all playlists with preview data", async () => {
      const mockPlaylists = [
        {
          id: 1,
          name: "My Playlist",
          description: "Description",
          createdAt: new Date(),
          updatedAt: new Date(),
          videos: [{ thumbnail: "thumb1.jpg", duration: 300 }],
          _count: { videos: 1 },
        },
      ];

      prismaMock.playlist.findMany.mockResolvedValue(mockPlaylists);

      const result = await getPlaylists();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("My Playlist");
      expect(result[0].videoCount).toBe(1);
      expect(result[0].previewThumbnails).toEqual(["thumb1.jpg"]);
    });
  });

  describe("getPlaylist", () => {
    it("returns playlist with all videos", async () => {
      const mockPlaylist = {
        id: 1,
        name: "My Playlist",
        description: "Description",
        createdAt: new Date(),
        updatedAt: new Date(),
        videos: [
          {
            id: 1,
            videoId: "abc123def45",
            title: "Video 1",
            thumbnail: "thumb.jpg",
            channelId: "ch1",
            channelName: "Channel",
            duration: 300,
            position: 0,
            addedAt: new Date(),
          },
        ],
      };

      prismaMock.playlist.findUnique.mockResolvedValue(mockPlaylist);

      const result = await getPlaylist(1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("My Playlist");
      expect(result?.videos).toHaveLength(1);
    });

    it("returns null for non-existent playlist", async () => {
      prismaMock.playlist.findUnique.mockResolvedValue(null);

      const result = await getPlaylist(999);

      expect(result).toBeNull();
    });
  });

  describe("getPlaylistsForVideo", () => {
    it("returns playlist IDs containing the video", async () => {
      prismaMock.playlistVideo.findMany.mockResolvedValue([
        { playlistId: 1 },
        { playlistId: 3 },
      ]);

      const result = await getPlaylistsForVideo("abc123def45");

      expect(result).toEqual([1, 3]);
    });
  });

  describe("createPlaylist", () => {
    it("creates a new playlist", async () => {
      const mockCreated = {
        id: 1,
        name: "New Playlist",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.playlist.create.mockResolvedValue(mockCreated);

      const result = await createPlaylist({ name: "New Playlist" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Playlist");
        expect(result.data.videoCount).toBe(0);
      }
    });

    it("trims whitespace from name and description", async () => {
      const mockCreated = {
        id: 1,
        name: "Trimmed",
        description: "Also trimmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.playlist.create.mockResolvedValue(mockCreated);

      await createPlaylist({
        name: "  Trimmed  ",
        description: "  Also trimmed  ",
      });

      expect(prismaMock.playlist.create).toHaveBeenCalledWith({
        data: {
          name: "Trimmed",
          description: "Also trimmed",
        },
      });
    });

    it("returns error on failure", async () => {
      prismaMock.playlist.create.mockRejectedValue(new Error("DB error"));

      const result = await createPlaylist({ name: "Fail" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to create playlist");
      }
    });
  });

  describe("updatePlaylist", () => {
    it("updates playlist name and description", async () => {
      prismaMock.playlist.update.mockResolvedValue({});

      const result = await updatePlaylist(1, {
        name: "Updated",
        description: "New desc",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.playlist.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated",
          description: "New desc",
        },
      });
    });
  });

  describe("deletePlaylist", () => {
    it("deletes playlist", async () => {
      prismaMock.playlist.delete.mockResolvedValue({});

      const result = await deletePlaylist(1);

      expect(result.success).toBe(true);
      expect(prismaMock.playlist.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("returns false on failure", async () => {
      prismaMock.playlist.delete.mockRejectedValue(new Error("Not found"));

      const result = await deletePlaylist(999);

      expect(result.success).toBe(false);
    });
  });

  describe("addToPlaylist", () => {
    it("adds video to playlist", async () => {
      prismaMock.playlistVideo.findUnique.mockResolvedValue(null);
      prismaMock.playlistVideo.findFirst.mockResolvedValue(null);
      prismaMock.playlistVideo.create.mockResolvedValue({});
      prismaMock.playlist.update.mockResolvedValue({});

      const result = await addToPlaylist(1, mockVideo);

      expect(result.success).toBe(true);
      expect(prismaMock.playlistVideo.create).toHaveBeenCalled();
    });

    it("returns error when video already in playlist", async () => {
      prismaMock.playlistVideo.findUnique.mockResolvedValue({ id: 1 });

      const result = await addToPlaylist(1, mockVideo);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Video already in playlist");
    });

    it("assigns correct position for new video", async () => {
      prismaMock.playlistVideo.findUnique.mockResolvedValue(null);
      prismaMock.playlistVideo.findFirst.mockResolvedValue({ position: 5 });
      prismaMock.playlistVideo.create.mockResolvedValue({});
      prismaMock.playlist.update.mockResolvedValue({});

      await addToPlaylist(1, mockVideo);

      expect(prismaMock.playlistVideo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          position: 6,
        }),
      });
    });
  });

  describe("removeFromPlaylist", () => {
    it("removes video and reorders remaining", async () => {
      prismaMock.playlistVideo.delete.mockResolvedValue({});
      prismaMock.playlistVideo.findMany.mockResolvedValue([
        { id: 2, position: 0 },
        { id: 3, position: 2 },
      ]);
      prismaMock.playlistVideo.update.mockResolvedValue({});

      const result = await removeFromPlaylist(1, "abc123def45");

      expect(result.success).toBe(true);
      expect(prismaMock.playlistVideo.delete).toHaveBeenCalled();
    });
  });

  describe("toggleVideoInPlaylist", () => {
    it("adds video when not in playlist", async () => {
      prismaMock.playlistVideo.findUnique
        .mockResolvedValueOnce(null) // First check
        .mockResolvedValueOnce(null); // Check in addToPlaylist
      prismaMock.playlistVideo.findFirst.mockResolvedValue(null);
      prismaMock.playlistVideo.create.mockResolvedValue({});
      prismaMock.playlist.update.mockResolvedValue({});

      const result = await toggleVideoInPlaylist(1, mockVideo);

      expect(result.added).toBe(true);
      expect(result.success).toBe(true);
    });

    it("removes video when in playlist", async () => {
      prismaMock.playlistVideo.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.playlistVideo.delete.mockResolvedValue({});
      prismaMock.playlistVideo.findMany.mockResolvedValue([]);

      const result = await toggleVideoInPlaylist(1, mockVideo);

      expect(result.added).toBe(false);
      expect(result.success).toBe(true);
    });
  });

  describe("getPlaylistsWithVideoStatus", () => {
    it("returns playlists with hasVideo flag", async () => {
      prismaMock.playlist.findMany.mockResolvedValue([
        { id: 1, name: "Playlist 1", videos: [{ id: 1 }] },
        { id: 2, name: "Playlist 2", videos: [] },
      ]);

      const result = await getPlaylistsWithVideoStatus("abc123def45");

      expect(result).toHaveLength(2);
      expect(result[0].hasVideo).toBe(true);
      expect(result[1].hasVideo).toBe(false);
    });
  });
});
