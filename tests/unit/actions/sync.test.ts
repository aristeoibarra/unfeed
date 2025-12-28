import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/youtube", () => ({
  getChannelVideos: vi.fn(),
}));

import { getChannelVideos } from "@/lib/youtube";
import {
  getSyncStatus,
  syncVideos,
  getSyncLogs,
  getSyncSummary,
} from "@/actions/sync";

const mockGetChannelVideos = getChannelVideos as ReturnType<typeof vi.fn>;

describe("actions/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSyncStatus", () => {
    it("returns needs sync when no subscriptions have sync status", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null },
      ]);
      prismaMock.syncStatus.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      const result = await getSyncStatus();

      expect(result.needsSync).toBe(true);
      expect(result.subscriptionCount).toBe(1);
    });

    it("returns needs sync when sync is older than 6 hours", async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 7);

      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null },
      ]);
      prismaMock.syncStatus.findMany.mockResolvedValue([
        { channelId: "ch1", lastSyncedAt: oldDate, status: "ok" },
      ]);
      prismaMock.video.count.mockResolvedValue(50);

      const result = await getSyncStatus();

      expect(result.needsSync).toBe(true);
      expect(result.cachedVideoCount).toBe(50);
    });

    it("returns no sync needed when recent sync exists", async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1);

      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null },
      ]);
      prismaMock.syncStatus.findMany.mockResolvedValue([
        { channelId: "ch1", lastSyncedAt: recentDate, status: "ok" },
      ]);
      prismaMock.video.count.mockResolvedValue(100);

      const result = await getSyncStatus();

      expect(result.needsSync).toBe(false);
    });

    it("counts channels with errors", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null },
        { id: 2, channelId: "ch2", name: "Channel 2", deletedAt: null },
      ]);
      prismaMock.syncStatus.findMany.mockResolvedValue([
        { channelId: "ch1", lastSyncedAt: new Date(), status: "ok" },
        { channelId: "ch2", lastSyncedAt: new Date(), status: "error" },
      ]);
      prismaMock.video.count.mockResolvedValue(50);

      const result = await getSyncStatus();

      expect(result.channelsWithErrors).toBe(1);
    });
  });

  describe("syncVideos", () => {
    it("returns success when no subscriptions exist", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.syncLog.create.mockResolvedValue({ id: 1 });

      const result = await syncVideos();

      expect(result.success).toBe(true);
      expect(result.message).toBe("No subscriptions to sync");
      expect(result.syncedCount).toBe(0);
      expect(prismaMock.syncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "manual",
          status: "success",
          channelsSynced: 0,
          triggeredBy: "user",
        }),
      });
    });

    it("syncs videos and creates log on success", async () => {
      const mockVideos = [
        {
          videoId: "v1",
          title: "Video 1",
          thumbnail: "thumb1.jpg",
          channelId: "ch1",
          channelName: "Channel 1",
          publishedAt: new Date().toISOString(),
          duration: 300,
        },
      ];

      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null, syncStatus: null },
      ]);
      prismaMock.syncStatus.upsert.mockResolvedValue({});
      prismaMock.syncStatus.update.mockResolvedValue({});
      mockGetChannelVideos.mockResolvedValue({ videos: mockVideos });
      prismaMock.video.upsert.mockResolvedValue({});
      prismaMock.video.count.mockResolvedValue(1);
      prismaMock.syncLog.create.mockResolvedValue({ id: 1 });

      const result = await syncVideos();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(prismaMock.syncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "manual",
          status: "success",
          channelsSynced: 1,
          triggeredBy: "user",
        }),
      });
    });

    it("creates error log on failure", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null, syncStatus: null },
      ]);
      prismaMock.syncStatus.upsert.mockResolvedValue({});
      mockGetChannelVideos.mockRejectedValue(new Error("API Error"));
      prismaMock.syncLog.create.mockResolvedValue({ id: 1 });

      const result = await syncVideos();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Sync failed");
      expect(prismaMock.syncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "manual",
          status: "error",
          errors: expect.stringContaining("API Error"),
        }),
      });
    });

    it("handles quota exceeded error", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null, syncStatus: null },
      ]);
      prismaMock.syncStatus.upsert.mockResolvedValue({});
      mockGetChannelVideos.mockRejectedValue(new Error("quota exceeded"));
      prismaMock.syncLog.create.mockResolvedValue({ id: 1 });

      const result = await syncVideos();

      expect(result.success).toBe(false);
      expect(result.message).toContain("quota exceeded");
    });

    it("skips channels with error status", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        {
          id: 1,
          channelId: "ch1",
          name: "Channel 1",
          deletedAt: null,
          syncStatus: { status: "error" },
        },
      ]);
      prismaMock.syncLog.create.mockResolvedValue({ id: 1 });

      const result = await syncVideos();

      expect(result.success).toBe(true);
      expect(result.message).toBe("No subscriptions to sync");
    });
  });

  describe("getSyncLogs", () => {
    it("returns recent sync logs ordered by date", async () => {
      const mockLogs = [
        {
          id: 2,
          type: "manual",
          status: "success",
          channelsSynced: 5,
          newVideos: 10,
          apiUnitsUsed: 505,
          errors: null,
          duration: 30,
          triggeredBy: "user",
          createdAt: new Date("2024-01-02"),
        },
        {
          id: 1,
          type: "auto",
          status: "success",
          channelsSynced: 5,
          newVideos: 3,
          apiUnitsUsed: 505,
          errors: null,
          duration: 25,
          triggeredBy: "cron",
          createdAt: new Date("2024-01-01"),
        },
      ];

      prismaMock.syncLog.findMany.mockResolvedValue(mockLogs);

      const result = await getSyncLogs(10);

      expect(result).toHaveLength(2);
      expect(prismaMock.syncLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    });

    it("respects custom limit", async () => {
      prismaMock.syncLog.findMany.mockResolvedValue([]);

      await getSyncLogs(5);

      expect(prismaMock.syncLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    });
  });

  describe("getSyncSummary", () => {
    it("returns summary with last sync info", async () => {
      const lastSyncDate = new Date();
      lastSyncDate.setHours(lastSyncDate.getHours() - 2);

      const mockLastSync = {
        id: 1,
        type: "manual",
        status: "success",
        channelsSynced: 10,
        newVideos: 5,
        createdAt: lastSyncDate,
      };

      prismaMock.syncLog.findFirst.mockResolvedValue(mockLastSync);
      prismaMock.subscription.count.mockResolvedValue(10);
      prismaMock.video.count.mockResolvedValue(500);

      const result = await getSyncSummary();

      expect(result.lastSync).toEqual(mockLastSync);
      expect(result.channelCount).toBe(10);
      expect(result.totalVideos).toBe(500);
      expect(result.nextAutoSync).not.toBeNull();
    });

    it("returns null nextAutoSync when last sync is old enough", async () => {
      const oldSyncDate = new Date();
      oldSyncDate.setHours(oldSyncDate.getHours() - 10);

      const mockLastSync = {
        id: 1,
        type: "auto",
        status: "success",
        createdAt: oldSyncDate,
      };

      prismaMock.syncLog.findFirst.mockResolvedValue(mockLastSync);
      prismaMock.subscription.count.mockResolvedValue(5);
      prismaMock.video.count.mockResolvedValue(100);

      const result = await getSyncSummary();

      expect(result.nextAutoSync).toBeNull();
    });

    it("handles no previous syncs", async () => {
      prismaMock.syncLog.findFirst.mockResolvedValue(null);
      prismaMock.subscription.count.mockResolvedValue(3);
      prismaMock.video.count.mockResolvedValue(0);

      const result = await getSyncSummary();

      expect(result.lastSync).toBeNull();
      expect(result.nextAutoSync).toBeNull();
      expect(result.channelCount).toBe(3);
      expect(result.totalVideos).toBe(0);
    });

    it("excludes skipped syncs from lastSync", async () => {
      prismaMock.syncLog.findFirst.mockResolvedValue(null);
      prismaMock.subscription.count.mockResolvedValue(5);
      prismaMock.video.count.mockResolvedValue(100);

      await getSyncSummary();

      expect(prismaMock.syncLog.findFirst).toHaveBeenCalledWith({
        where: { status: { not: "skipped" } },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
