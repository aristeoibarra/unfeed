import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";

describe("actions/audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("getAudioUrl", () => {
    it("returns null for invalid video ID format", async () => {
      const { getAudioUrl } = await import("@/actions/audio");
      const result = await getAudioUrl("invalid");
      expect(result).toBeNull();
    });

    it("returns null for video ID with invalid characters", async () => {
      const { getAudioUrl } = await import("@/actions/audio");
      const result = await getAudioUrl("abc!@#$%^&*()");
      expect(result).toBeNull();
    });

    it("validates 11 character video IDs", async () => {
      const { getAudioUrl } = await import("@/actions/audio");

      // Too short
      const result1 = await getAudioUrl("abc123");
      expect(result1).toBeNull();

      // Too long
      const result2 = await getAudioUrl("abc123def456789");
      expect(result2).toBeNull();
    });

    it("returns cached URL when cache is valid", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour in future
      prismaMock.audioCache.findUnique.mockResolvedValueOnce({
        id: 1,
        videoId: "dQw4w9WgXcQ",
        audioUrl: "https://cached-audio-url.com",
        expiresAt: futureDate,
      });

      const { getAudioUrl } = await import("@/actions/audio");
      const result = await getAudioUrl("dQw4w9WgXcQ");

      expect(result).toBe("https://cached-audio-url.com");
      expect(prismaMock.audioCache.findUnique).toHaveBeenCalledWith({
        where: { videoId: "dQw4w9WgXcQ" },
      });
    });

    it("does not return expired cache", async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour in past
      prismaMock.audioCache.findUnique.mockResolvedValueOnce({
        id: 1,
        videoId: "dQw4w9WgXcQ",
        audioUrl: "https://expired-audio-url.com",
        expiresAt: pastDate,
      });

      const { getAudioUrl } = await import("@/actions/audio");
      const result = await getAudioUrl("dQw4w9WgXcQ");

      // Should not return the expired cache (yt-dlp will fail since it's not mocked)
      expect(result).toBeNull();
    });
  });

  describe("isAudioModeAvailable", () => {
    it("returns true when audio mode is not disabled", async () => {
      process.env.ENABLE_AUDIO_MODE = "true";
      const { isAudioModeAvailable } = await import("@/actions/audio");

      const result = await isAudioModeAvailable();
      expect(result).toBe(true);
    });

    it("returns false when audio mode is explicitly disabled", async () => {
      process.env.ENABLE_AUDIO_MODE = "false";
      const { isAudioModeAvailable } = await import("@/actions/audio");

      const result = await isAudioModeAvailable();
      expect(result).toBe(false);
    });

    it("returns true when ENABLE_AUDIO_MODE is not set", async () => {
      delete process.env.ENABLE_AUDIO_MODE;
      const { isAudioModeAvailable } = await import("@/actions/audio");

      const result = await isAudioModeAvailable();
      expect(result).toBe(true);
    });
  });
});
