import { describe, it, expect, vi, beforeEach } from "vitest";

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
