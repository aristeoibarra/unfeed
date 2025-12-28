import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useYouTubePlayer,
  YouTubePlayerState,
  buildYouTubeEmbedUrl,
} from "@/hooks/useYouTubePlayer";

describe("useYouTubePlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("returns correct initial values", () => {
      const { result } = renderHook(() =>
        useYouTubePlayer({ videoId: "abc123def45" })
      );

      expect(result.current.isReady).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.playerState).toBe(YouTubePlayerState.UNSTARTED);
      expect(result.current.iframeRef).toBeDefined();
      expect(result.current.controls).toBeDefined();
    });

    it("provides player control methods", () => {
      const { result } = renderHook(() =>
        useYouTubePlayer({ videoId: "abc123def45" })
      );

      expect(typeof result.current.controls.playVideo).toBe("function");
      expect(typeof result.current.controls.pauseVideo).toBe("function");
      expect(typeof result.current.controls.seekTo).toBe("function");
      expect(typeof result.current.controls.mute).toBe("function");
      expect(typeof result.current.controls.unMute).toBe("function");
      expect(typeof result.current.controls.setVolume).toBe("function");
      expect(typeof result.current.controls.getCurrentTime).toBe("function");
      expect(typeof result.current.controls.getDuration).toBe("function");
      expect(typeof result.current.controls.getPlayerState).toBe("function");
    });
  });

  describe("videoId changes", () => {
    it("resets state when videoId changes", () => {
      const { result, rerender } = renderHook(
        ({ videoId }) => useYouTubePlayer({ videoId }),
        { initialProps: { videoId: "abc123def45" } }
      );

      // Simulate some state changes
      act(() => {
        result.current.controls.seekTo(100);
      });

      expect(result.current.currentTime).toBe(100);

      // Change videoId
      rerender({ videoId: "xyz789abc12" });

      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.isReady).toBe(false);
      expect(result.current.playerState).toBe(YouTubePlayerState.UNSTARTED);
    });
  });

  describe("controls", () => {
    it("seekTo updates currentTime immediately", () => {
      const { result } = renderHook(() =>
        useYouTubePlayer({ videoId: "abc123def45" })
      );

      act(() => {
        result.current.controls.seekTo(150);
      });

      expect(result.current.currentTime).toBe(150);
      expect(result.current.controls.getCurrentTime()).toBe(150);
    });
  });
});

describe("buildYouTubeEmbedUrl", () => {
  it("builds correct embed URL with default options", () => {
    const url = buildYouTubeEmbedUrl("abc123def45");

    expect(url).toContain("https://www.youtube-nocookie.com/embed/abc123def45");
    expect(url).toContain("enablejsapi=1");
    expect(url).toContain("autoplay=0");
    expect(url).toContain("rel=0");
    expect(url).toContain("modestbranding=1");
    expect(url).toContain("playsinline=1");
    // Default language settings
    expect(url).toContain("hl=es");
    expect(url).toContain("cc_lang_pref=es");
    expect(url).toContain("cc_load_policy=0");
  });

  it("sets autoplay when enabled", () => {
    const url = buildYouTubeEmbedUrl("abc123def45", { autoplay: true });

    expect(url).toContain("autoplay=1");
  });

  it("includes custom origin", () => {
    const url = buildYouTubeEmbedUrl("abc123def45", {
      origin: "https://example.com",
    });

    expect(url).toContain("origin=https%3A%2F%2Fexample.com");
  });

  it("sets preferred language", () => {
    const url = buildYouTubeEmbedUrl("abc123def45", {
      preferredLanguage: "en",
    });

    expect(url).toContain("hl=en");
    expect(url).toContain("cc_lang_pref=en");
  });

  it("enables auto show subtitles", () => {
    const url = buildYouTubeEmbedUrl("abc123def45", {
      autoShowSubtitles: true,
    });

    expect(url).toContain("cc_load_policy=1");
  });

  it("combines language options correctly", () => {
    const url = buildYouTubeEmbedUrl("abc123def45", {
      preferredLanguage: "en",
      autoShowSubtitles: true,
    });

    expect(url).toContain("hl=en");
    expect(url).toContain("cc_lang_pref=en");
    expect(url).toContain("cc_load_policy=1");
  });
});

describe("YouTubePlayerState", () => {
  it("has correct state values", () => {
    expect(YouTubePlayerState.UNSTARTED).toBe(-1);
    expect(YouTubePlayerState.ENDED).toBe(0);
    expect(YouTubePlayerState.PLAYING).toBe(1);
    expect(YouTubePlayerState.PAUSED).toBe(2);
    expect(YouTubePlayerState.BUFFERING).toBe(3);
    expect(YouTubePlayerState.CUED).toBe(5);
  });
});
