import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/youtube", () => ({
  getChannelVideos: vi.fn(),
}));

vi.mock("@/actions/settings", () => ({
  getSyncIntervalHours: vi.fn(() => Promise.resolve(6)),
}));

import { getChannelVideos } from "@/lib/youtube";
import { getSyncIntervalHours } from "@/actions/settings";
import {
  getSyncStatus,
  syncVideos,
  getSyncLogs,
  getSyncSummary,
} from "@/actions/sync";

const mockGetChannelVideos = getChannelVideos as ReturnType<typeof vi.fn>;
const mockGetSyncIntervalHours = getSyncIntervalHours as ReturnType<typeof vi.fn>;

describe("actions/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSyncIntervalHours.mockResolvedValue(6);
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

    it("returns needs sync when sync is older than configured interval", async () => {
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

    it("respects custom sync interval from settings", async () => {
      mockGetSyncIntervalHours.mockResolvedValue(12);

      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 10); // 10 hours ago

      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null },
      ]);
      prismaMock.syncStatus.findMany.mockResolvedValue([
        { channelId: "ch1", lastSyncedAt: oldDate, status: "ok" },
      ]);
      prismaMock.video.count.mockResolvedValue(50);

      const result = await getSyncStatus();

      // With 12h interval, 10h old sync should NOT need sync yet
      expect(result.needsSync).toBe(false);
    });

    it("needs sync when older than custom interval", async () => {
      mockGetSyncIntervalHours.mockResolvedValue(3);

      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 4); // 4 hours ago

      prismaMock.subscription.findMany.mockResolvedValue([
        { id: 1, channelId: "ch1", name: "Channel 1", deletedAt: null },
      ]);
      prismaMock.syncStatus.findMany.mockResolvedValue([
        { channelId: "ch1", lastSyncedAt: oldDate, status: "ok" },
      ]);
      prismaMock.video.count.mockResolvedValue(50);

      const result = await getSyncStatus();

      // With 3h interval, 4h old sync SHOULD need sync
      expect(result.needsSync).toBe(true);
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
      prismaMock.subscription.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8); // enabled
      prismaMock.video.count.mockResolvedValue(500);

      const result = await getSyncSummary();

      expect(result.lastSync).toEqual(mockLastSync);
      expect(result.channelCount).toBe(10);
      expect(result.enabledChannelCount).toBe(8);
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
      prismaMock.subscription.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);
      prismaMock.video.count.mockResolvedValue(100);

      const result = await getSyncSummary();

      expect(result.nextAutoSync).toBeNull();
    });

    it("handles no previous syncs", async () => {
      prismaMock.syncLog.findFirst.mockResolvedValue(null);
      prismaMock.subscription.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(3);
      prismaMock.video.count.mockResolvedValue(0);

      const result = await getSyncSummary();

      expect(result.lastSync).toBeNull();
      expect(result.nextAutoSync).toBeNull();
      expect(result.channelCount).toBe(3);
      expect(result.totalVideos).toBe(0);
    });

    it("excludes skipped syncs from lastSync", async () => {
      prismaMock.syncLog.findFirst.mockResolvedValue(null);
      prismaMock.subscription.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);
      prismaMock.video.count.mockResolvedValue(100);

      await getSyncSummary();

      expect(prismaMock.syncLog.findFirst).toHaveBeenCalledWith({
        where: { status: { not: "skipped" } },
        orderBy: { createdAt: "desc" },
      });
    });

    it("calculates nextAutoSync based on configured interval", async () => {
      mockGetSyncIntervalHours.mockResolvedValue(12);

      const lastSyncDate = new Date();
      lastSyncDate.setHours(lastSyncDate.getHours() - 2);

      const mockLastSync = {
        id: 1,
        type: "manual",
        status: "success",
        createdAt: lastSyncDate,
      };

      prismaMock.syncLog.findFirst.mockResolvedValue(mockLastSync);
      prismaMock.subscription.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);
      prismaMock.video.count.mockResolvedValue(100);

      const result = await getSyncSummary();

      // With 12h interval and 2h since last sync, nextAutoSync should be ~10h from now
      expect(result.nextAutoSync).not.toBeNull();
      const hoursUntilNext =
        (result.nextAutoSync!.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursUntilNext).toBeGreaterThan(9);
      expect(hoursUntilNext).toBeLessThan(11);
    });

    it("returns null nextAutoSync when past configured interval", async () => {
      mockGetSyncIntervalHours.mockResolvedValue(3);

      const oldSyncDate = new Date();
      oldSyncDate.setHours(oldSyncDate.getHours() - 5); // 5 hours ago

      const mockLastSync = {
        id: 1,
        type: "auto",
        status: "success",
        createdAt: oldSyncDate,
      };

      prismaMock.syncLog.findFirst.mockResolvedValue(mockLastSync);
      prismaMock.subscription.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);
      prismaMock.video.count.mockResolvedValue(100);

      const result = await getSyncSummary();

      // With 3h interval and 5h since last sync, should already be due
      expect(result.nextAutoSync).toBeNull();
    });

    it("calculates estimated quota usage", async () => {
      mockGetSyncIntervalHours.mockResolvedValue(6); // 4 syncs per day

      prismaMock.syncLog.findFirst.mockResolvedValue(null);
      prismaMock.subscription.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5); // enabled
      prismaMock.video.count.mockResolvedValue(100);

      const result = await getSyncSummary();

      // 5 enabled channels * 101 units * 4 syncs/day = 2020 units
      expect(result.quota.dailyUnitsEstimate).toBe(2020);
      expect(result.quota.dailyQuota).toBe(10000);
      expect(result.quota.percentage).toBe(20);
      expect(result.quota.syncsPerDay).toBe(4);
    });

    it("calculates quota for 24h interval", async () => {
      mockGetSyncIntervalHours.mockResolvedValue(24); // 1 sync per day

      prismaMock.syncLog.findFirst.mockResolvedValue(null);
      prismaMock.subscription.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(10); // enabled
      prismaMock.video.count.mockResolvedValue(500);

      const result = await getSyncSummary();

      // 10 enabled channels * 101 units * 1 sync/day = 1010 units
      expect(result.quota.dailyUnitsEstimate).toBe(1010);
      expect(result.quota.syncsPerDay).toBe(1);
      expect(result.quota.percentage).toBe(10);
    });
  });
});
