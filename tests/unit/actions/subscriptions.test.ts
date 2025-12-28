import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/youtube", () => ({
  getChannelInfo: vi.fn(),
}));

vi.mock("@/actions/sync", () => ({
  deepSync: vi.fn().mockResolvedValue(undefined),
}));

import { getChannelInfo } from "@/lib/youtube";
import {
  getSubscriptions,
  getSubscription,
  addSubscription,
  deleteSubscription,
  hardDeleteSubscription,
} from "@/actions/subscriptions";

const mockGetChannelInfo = getChannelInfo as ReturnType<typeof vi.fn>;

describe("actions/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSubscriptions", () => {
    it("returns active subscriptions ordered by date", async () => {
      const mockSubs = [
        {
          id: 1,
          channelId: "ch1",
          name: "Channel 1",
          thumbnail: "thumb1.jpg",
          category: null,
          createdAt: new Date(),
        },
      ];

      prismaMock.subscription.findMany.mockResolvedValue(mockSubs);

      const result = await getSubscriptions();

      expect(result).toHaveLength(1);
      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getSubscription", () => {
    it("returns subscription by channel ID", async () => {
      const mockSub = {
        id: 1,
        channelId: "ch1",
        name: "Channel 1",
        thumbnail: "thumb1.jpg",
        category: null,
      };

      prismaMock.subscription.findUnique.mockResolvedValue(mockSub);

      const result = await getSubscription("ch1");

      expect(result).toEqual(mockSub);
      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { channelId: "ch1" },
        include: { category: true },
      });
    });
  });

  describe("addSubscription", () => {
    const mockChannelInfo = {
      channelId: "UCxyz123",
      name: "Test Channel",
      thumbnail: "https://example.com/thumb.jpg",
    };

    it("creates new subscription for valid channel", async () => {
      mockGetChannelInfo.mockResolvedValue(mockChannelInfo);
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      prismaMock.subscription.create.mockResolvedValue({ id: 1 });

      const result = await addSubscription("@TestChannel");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("reactivates soft-deleted subscription", async () => {
      mockGetChannelInfo.mockResolvedValue(mockChannelInfo);
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 1,
        channelId: "UCxyz123",
        deletedAt: new Date(),
      });
      prismaMock.subscription.update.mockResolvedValue({ id: 1 });

      const result = await addSubscription("@TestChannel");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reactivated).toBe(true);
      }
    });

    it("returns error for already subscribed channel", async () => {
      mockGetChannelInfo.mockResolvedValue(mockChannelInfo);
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 1,
        channelId: "UCxyz123",
        deletedAt: null,
      });

      const result = await addSubscription("@TestChannel");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Already subscribed");
      }
    });

    it("returns error when channel not found", async () => {
      mockGetChannelInfo.mockResolvedValue(null);

      const result = await addSubscription("@NonExistent");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Could not find channel");
      }
    });

    it("returns error for empty input", async () => {
      const result = await addSubscription("");

      expect(result.success).toBe(false);
    });

    it("handles full YouTube URL", async () => {
      mockGetChannelInfo.mockResolvedValue(mockChannelInfo);
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      prismaMock.subscription.create.mockResolvedValue({ id: 1 });

      await addSubscription("https://www.youtube.com/@TestChannel");

      expect(mockGetChannelInfo).toHaveBeenCalledWith(
        "https://www.youtube.com/@TestChannel"
      );
    });

    it("converts plain name to YouTube URL", async () => {
      mockGetChannelInfo.mockResolvedValue(mockChannelInfo);
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      prismaMock.subscription.create.mockResolvedValue({ id: 1 });

      await addSubscription("TestChannel");

      expect(mockGetChannelInfo).toHaveBeenCalledWith(
        "https://www.youtube.com/@TestChannel"
      );
    });
  });

  describe("deleteSubscription", () => {
    it("soft deletes subscription", async () => {
      prismaMock.subscription.update.mockResolvedValue({});

      const result = await deleteSubscription(1);

      expect(result.success).toBe(true);
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("returns error on failure", async () => {
      prismaMock.subscription.update.mockRejectedValue(new Error("Not found"));

      const result = await deleteSubscription(999);

      expect(result.success).toBe(false);
    });
  });

  describe("hardDeleteSubscription", () => {
    it("completely deletes subscription and related data", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 1,
        channelId: "ch1",
      });
      prismaMock.video.deleteMany.mockResolvedValue({ count: 10 });
      prismaMock.syncStatus.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.subscription.delete.mockResolvedValue({});

      const result = await hardDeleteSubscription(1);

      expect(result.success).toBe(true);
      expect(prismaMock.video.deleteMany).toHaveBeenCalledWith({
        where: { channelId: "ch1" },
      });
      expect(prismaMock.syncStatus.deleteMany).toHaveBeenCalledWith({
        where: { channelId: "ch1" },
      });
      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("returns error when subscription not found", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      const result = await hardDeleteSubscription(999);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Subscription not found");
      }
    });
  });
});
