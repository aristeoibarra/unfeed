import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";

// Mock updateProgress action
vi.mock("@/actions/history", () => ({
  updateProgress: vi.fn().mockResolvedValue(undefined),
}));

describe("PlayerContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlayerProvider>{children}</PlayerProvider>
  );

  describe("usePlayer hook", () => {
    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => usePlayer());
      }).toThrow("usePlayer must be used within a PlayerProvider");
    });

    it("returns context when used inside provider", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.currentVideo).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isAudioMode).toBe(false);
    });
  });

  describe("initial state", () => {
    it("has correct default values", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      expect(result.current.currentVideo).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isAudioMode).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.historyId).toBeNull();
      expect(result.current.savedProgress).toBeNull();
      expect(result.current.audioUrl).toBeNull();
    });
  });

  describe("playVideo", () => {
    it("sets current video and starts playing", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      const video = {
        videoId: "abc123def45",
        title: "Test Video",
        channelName: "Test Channel",
        thumbnail: "https://example.com/thumb.jpg",
        duration: 300,
      };

      act(() => {
        result.current.playVideo(video);
      });

      expect(result.current.currentVideo).toEqual(video);
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.duration).toBe(300);
      expect(result.current.currentTime).toBe(0);
    });
  });

  describe("pause and resume", () => {
    it("pause sets isPlaying to false", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.playVideo({
          videoId: "abc123def45",
          title: "Test",
          channelName: "Channel",
          thumbnail: "thumb.jpg",
        });
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it("resume sets isPlaying to true", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setIsPlaying(false);
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe("toggleAudioMode", () => {
    it("toggles audio mode on and off", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      expect(result.current.isAudioMode).toBe(false);

      act(() => {
        result.current.toggleAudioMode();
      });

      expect(result.current.isAudioMode).toBe(true);

      act(() => {
        result.current.toggleAudioMode();
      });

      expect(result.current.isAudioMode).toBe(false);
    });
  });

  describe("seek", () => {
    it("updates current time", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.seek(150);
      });

      expect(result.current.currentTime).toBe(150);
    });
  });

  describe("stop", () => {
    it("resets all state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      // Set up some state
      act(() => {
        result.current.playVideo({
          videoId: "abc123def45",
          title: "Test",
          channelName: "Channel",
          thumbnail: "thumb.jpg",
          duration: 300,
        });
        result.current.setCurrentTime(150);
        result.current.setHistoryId(1);
        result.current.toggleAudioMode();
      });

      // Verify state is set
      expect(result.current.currentVideo).not.toBeNull();
      expect(result.current.isPlaying).toBe(true);

      // Stop
      act(() => {
        result.current.stop();
      });

      // Verify reset
      expect(result.current.currentVideo).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isAudioMode).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.historyId).toBeNull();
      expect(result.current.audioUrl).toBeNull();
    });
  });

  describe("setters", () => {
    it("setCurrentTime updates time", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setCurrentTime(120);
      });

      expect(result.current.currentTime).toBe(120);
    });

    it("setDuration updates duration", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setDuration(600);
      });

      expect(result.current.duration).toBe(600);
    });

    it("setHistoryId updates history ID", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setHistoryId(42);
      });

      expect(result.current.historyId).toBe(42);
    });

    it("setSavedProgress updates saved progress", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setSavedProgress(180);
      });

      expect(result.current.savedProgress).toBe(180);
    });

    it("setAudioUrl updates audio URL", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      act(() => {
        result.current.setAudioUrl("https://example.com/audio.mp3");
      });

      expect(result.current.audioUrl).toBe("https://example.com/audio.mp3");
    });
  });

  describe("audioRef", () => {
    it("provides audio ref", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      expect(result.current.audioRef).toBeDefined();
      expect(result.current.audioRef.current).toBeDefined();
    });
  });
});
