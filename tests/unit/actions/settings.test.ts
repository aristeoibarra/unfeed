import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getSettings,
  updateSettings,
  updateSyncInterval,
  getSyncIntervalHours,
} from "@/actions/settings";

describe("actions/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.settings.findFirst.mockReset();
    prismaMock.settings.create.mockReset();
    prismaMock.settings.update.mockReset();
  });

  describe("getSettings", () => {
    it("returns existing settings", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: 60,
        weeklyLimitMinutes: 300,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      const result = await getSettings();

      expect(result).toEqual({
        hideDislikedFromFeed: true,
        dailyLimitMinutes: 60,
        weeklyLimitMinutes: 300,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });
    });

    it("creates default settings when none exist", async () => {
      prismaMock.settings.findFirst.mockResolvedValue(null);
      prismaMock.settings.create.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      const result = await getSettings();

      expect(prismaMock.settings.create).toHaveBeenCalled();
      expect(result).toEqual({
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });
    });

    it("returns English language setting", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "en",
        autoShowSubtitles: true,
        syncIntervalHours: 6,
      });

      const result = await getSettings();

      expect(result.preferredLanguage).toBe("en");
      expect(result.autoShowSubtitles).toBe(true);
    });

    it("returns custom sync interval", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 12,
      });

      const result = await getSettings();

      expect(result.syncIntervalHours).toBe(12);
    });
  });

  describe("updateSettings", () => {
    it("updates preferred language", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "en",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      const result = await updateSettings({ preferredLanguage: "en" });

      expect(prismaMock.settings.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { preferredLanguage: "en" },
      });
      expect(result.preferredLanguage).toBe("en");
    });

    it("updates autoShowSubtitles", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: true,
        syncIntervalHours: 6,
      });

      const result = await updateSettings({ autoShowSubtitles: true });

      expect(prismaMock.settings.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { autoShowSubtitles: true },
      });
      expect(result.autoShowSubtitles).toBe(true);
    });

    it("updates multiple settings at once", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: false,
        dailyLimitMinutes: 120,
        weeklyLimitMinutes: null,
        preferredLanguage: "en",
        autoShowSubtitles: true,
        syncIntervalHours: 6,
      });

      const result = await updateSettings({
        hideDislikedFromFeed: false,
        dailyLimitMinutes: 120,
        preferredLanguage: "en",
        autoShowSubtitles: true,
      });

      expect(result).toEqual({
        hideDislikedFromFeed: false,
        dailyLimitMinutes: 120,
        weeklyLimitMinutes: null,
        preferredLanguage: "en",
        autoShowSubtitles: true,
        syncIntervalHours: 6,
      });
    });
  });

  describe("updateSyncInterval", () => {
    it("updates sync interval to 3 hours", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 3,
      });

      const result = await updateSyncInterval(3);

      expect(prismaMock.settings.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { syncIntervalHours: 3 },
      });
      expect(result.syncIntervalHours).toBe(3);
    });

    it("updates sync interval to 24 hours", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 24,
      });

      const result = await updateSyncInterval(24);

      expect(result.syncIntervalHours).toBe(24);
    });
  });

  describe("getSyncIntervalHours", () => {
    it("returns sync interval from settings", async () => {
      prismaMock.settings.findFirst.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 12,
      });

      const result = await getSyncIntervalHours();

      expect(result).toBe(12);
    });

    it("returns default 6 when creating new settings", async () => {
      prismaMock.settings.findFirst.mockResolvedValue(null);
      prismaMock.settings.create.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
        syncIntervalHours: 6,
      });

      const result = await getSyncIntervalHours();

      expect(result).toBe(6);
    });
  });
});
