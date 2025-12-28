import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniPlayer } from "@/components/MiniPlayer";

// Mock usePathname - will be overridden per test
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock usePlayer
const mockUsePlayer = vi.fn();
vi.mock("@/contexts/PlayerContext", () => ({
  usePlayer: () => mockUsePlayer(),
}));

// Mock WatchTimeProgress component
vi.mock("@/components/WatchTimeProgress", () => ({
  WatchTimeProgress: () => <div data-testid="watch-time-progress" />,
}));

describe("MiniPlayer", () => {
  const mockVideo = {
    videoId: "abc123def45",
    title: "Test Video Title",
    channelName: "Test Channel",
    thumbnail: "https://example.com/thumb.jpg",
  };

  const defaultPlayerState = {
    currentVideo: mockVideo,
    isPlaying: true,
    isAudioMode: true,
    currentTime: 60,
    duration: 300,
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/feed");
    mockUsePlayer.mockReturnValue(defaultPlayerState);
  });

  describe("visibility conditions", () => {
    it("should NOT render when there is no current video", () => {
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        currentVideo: null,
      });

      const { container } = render(<MiniPlayer />);
      expect(container.firstChild).toBeNull();
    });

    it("should NOT render when not in audio mode", () => {
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        isAudioMode: false,
      });

      const { container } = render(<MiniPlayer />);
      expect(container.firstChild).toBeNull();
    });

    it("should NOT render when on watch page", () => {
      mockUsePathname.mockReturnValue("/watch/abc123def45");

      const { container } = render(<MiniPlayer />);
      expect(container.firstChild).toBeNull();
    });

    it("should NOT render when on any watch page path", () => {
      mockUsePathname.mockReturnValue("/watch/xyz789");

      const { container } = render(<MiniPlayer />);
      expect(container.firstChild).toBeNull();
    });

    it("should render when video exists, audio mode is on, and NOT on watch page", () => {
      mockUsePathname.mockReturnValue("/feed");

      render(<MiniPlayer />);

      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
      expect(screen.getByText("Test Channel")).toBeInTheDocument();
    });
  });

  describe("rendering on different pages", () => {
    it("should render on /feed", () => {
      mockUsePathname.mockReturnValue("/feed");

      render(<MiniPlayer />);
      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
    });

    it("should render on /history", () => {
      mockUsePathname.mockReturnValue("/history");

      render(<MiniPlayer />);
      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
    });

    it("should render on /subscriptions", () => {
      mockUsePathname.mockReturnValue("/subscriptions");

      render(<MiniPlayer />);
      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
    });

    it("should render on /playlists", () => {
      mockUsePathname.mockReturnValue("/playlists");

      render(<MiniPlayer />);
      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
    });

    it("should render on root path", () => {
      mockUsePathname.mockReturnValue("/");

      render(<MiniPlayer />);
      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
    });
  });

  describe("content rendering", () => {
    it("should display video title and channel name", () => {
      render(<MiniPlayer />);

      expect(screen.getByText("Test Video Title")).toBeInTheDocument();
      expect(screen.getByText("Test Channel")).toBeInTheDocument();
    });

    it("should display formatted time", () => {
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        currentTime: 125,
        duration: 300,
      });

      render(<MiniPlayer />);

      expect(screen.getByText("2:05 / 5:00")).toBeInTheDocument();
    });

    it("should link to watch page", () => {
      render(<MiniPlayer />);

      const links = screen.getAllByRole("link");
      const watchLink = links.find((link) =>
        link.getAttribute("href")?.includes("/watch/abc123def45")
      );
      expect(watchLink).toBeInTheDocument();
    });
  });

  describe("controls", () => {
    it("should call pause when clicking pause button while playing", async () => {
      const pauseFn = vi.fn();
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        isPlaying: true,
        pause: pauseFn,
      });

      render(<MiniPlayer />);

      const pauseButton = screen.getByRole("button", { name: /pause/i });
      pauseButton.click();

      expect(pauseFn).toHaveBeenCalled();
    });

    it("should call resume when clicking play button while paused", async () => {
      const resumeFn = vi.fn();
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        isPlaying: false,
        resume: resumeFn,
      });

      render(<MiniPlayer />);

      const playButton = screen.getByRole("button", { name: "Play" });
      playButton.click();

      expect(resumeFn).toHaveBeenCalled();
    });

    it("should call stop when clicking close button", async () => {
      const stopFn = vi.fn();
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        stop: stopFn,
      });

      render(<MiniPlayer />);

      const closeButton = screen.getByRole("button", { name: /close/i });
      closeButton.click();

      expect(stopFn).toHaveBeenCalled();
    });
  });

  describe("progress bar", () => {
    it("should show correct progress percentage", () => {
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        currentTime: 150,
        duration: 300,
      });

      render(<MiniPlayer />);

      const progressBar = document.querySelector(
        '[style*="width: 50%"]'
      );
      expect(progressBar).toBeInTheDocument();
    });

    it("should show 0% progress when duration is 0", () => {
      mockUsePlayer.mockReturnValue({
        ...defaultPlayerState,
        currentTime: 0,
        duration: 0,
      });

      render(<MiniPlayer />);

      const progressBar = document.querySelector(
        '[style*="width: 0%"]'
      );
      expect(progressBar).toBeInTheDocument();
    });
  });
});
