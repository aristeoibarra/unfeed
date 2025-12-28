import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getNotifications,
  getUnreadCount,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  cleanOldNotifications,
} from "@/actions/notifications";

describe("actions/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("returns paginated notifications with counts", async () => {
      const mockNotifications = [
        {
          id: 1,
          videoId: "video1video1",
          title: "New Video",
          thumbnail: "thumb.jpg",
          channelId: "ch1",
          channelName: "Channel",
          duration: 300,
          isRead: false,
          createdAt: new Date(),
          readAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unread

      const result = await getNotifications(1);

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it("correctly calculates hasMore for pagination", async () => {
      const mockNotifications = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          videoId: `video${i}video`,
          title: `Video ${i}`,
          thumbnail: "thumb.jpg",
          channelId: "ch1",
          channelName: "Channel",
          duration: 300,
          isRead: false,
          createdAt: new Date(),
          readAt: null,
        }));

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count
        .mockResolvedValueOnce(50) // total (more than one page)
        .mockResolvedValueOnce(25);

      const result = await getNotifications(1);

      expect(result.hasMore).toBe(true);
    });
  });

  describe("getUnreadCount", () => {
    it("returns count of unread notifications", async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const count = await getUnreadCount();

      expect(count).toBe(5);
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: { isRead: false },
      });
    });
  });

  describe("getRecentNotifications", () => {
    it("returns limited recent notifications", async () => {
      const mockNotifications = [
        {
          id: 1,
          videoId: "video1video1",
          title: "Recent Video",
          thumbnail: "thumb.jpg",
          channelId: "ch1",
          channelName: "Channel",
          duration: 300,
          isRead: false,
          createdAt: new Date(),
          readAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await getRecentNotifications(5);

      expect(result).toHaveLength(1);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    });
  });

  describe("markAsRead", () => {
    it("updates notification to read status", async () => {
      prismaMock.notification.update.mockResolvedValue({});

      await markAsRead(1);

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      });
    });
  });

  describe("markAllAsRead", () => {
    it("updates all unread notifications", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      await markAllAsRead();

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { isRead: false },
        data: expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      });
    });
  });

  describe("createNotification", () => {
    it("creates a new notification", async () => {
      prismaMock.notification.create.mockResolvedValue({});

      await createNotification({
        videoId: "video1video1",
        title: "New Video",
        thumbnail: "thumb.jpg",
        channelId: "ch1",
        channelName: "Channel",
        duration: 300,
      });

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          videoId: "video1video1",
          title: "New Video",
          thumbnail: "thumb.jpg",
          channelId: "ch1",
          channelName: "Channel",
          duration: 300,
        },
      });
    });
  });

  describe("cleanOldNotifications", () => {
    it("deletes notifications older than 30 days", async () => {
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 10 });

      const count = await cleanOldNotifications();

      expect(count).toBe(10);
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      });
    });
  });
});
