import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getSettings, updateSettings } from "@/actions/settings";

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
      });

      const result = await getSettings();

      expect(result).toEqual({
        hideDislikedFromFeed: true,
        dailyLimitMinutes: 60,
        weeklyLimitMinutes: 300,
        preferredLanguage: "es",
        autoShowSubtitles: false,
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
      });

      const result = await getSettings();

      expect(prismaMock.settings.create).toHaveBeenCalled();
      expect(result).toEqual({
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: false,
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
      });

      const result = await getSettings();

      expect(result.preferredLanguage).toBe("en");
      expect(result.autoShowSubtitles).toBe(true);
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
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "en",
        autoShowSubtitles: false,
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
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: true,
        dailyLimitMinutes: null,
        weeklyLimitMinutes: null,
        preferredLanguage: "es",
        autoShowSubtitles: true,
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
      });

      prismaMock.settings.update.mockResolvedValue({
        id: 1,
        hideDislikedFromFeed: false,
        dailyLimitMinutes: 120,
        weeklyLimitMinutes: null,
        preferredLanguage: "en",
        autoShowSubtitles: true,
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
      });
    });
  });
});
