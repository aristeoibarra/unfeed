import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SyncStatus } from "@/components/SyncStatus";

vi.mock("@/actions/sync", () => ({
  syncVideos: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { syncVideos } from "@/actions/sync";

const mockSyncVideos = syncVideos as ReturnType<typeof vi.fn>;

describe("SyncStatus", () => {
  const mockSummary = {
    lastSync: {
      id: 1,
      type: "manual",
      status: "success",
      channelsSynced: 10,
      newVideos: 5,
      apiUnitsUsed: 1010,
      errors: null,
      duration: 30,
      triggeredBy: "user",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    nextAutoSync: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    channelCount: 10,
    totalVideos: 500,
  };

  const mockLogs = [
    {
      id: 2,
      type: "manual",
      status: "success",
      channelsSynced: 10,
      newVideos: 5,
      apiUnitsUsed: 1010,
      errors: null,
      duration: 30,
      triggeredBy: "user",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 1,
      type: "auto",
      status: "success",
      channelsSynced: 10,
      newVideos: 3,
      apiUnitsUsed: 1010,
      errors: null,
      duration: 25,
      triggeredBy: "cron",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sync summary stats", () => {
    render(<SyncStatus summary={mockSummary} recentLogs={mockLogs} />);

    expect(screen.getByText("Last sync")).toBeInTheDocument();
    expect(screen.getByText("Next auto sync")).toBeInTheDocument();
    expect(screen.getByText("Channels")).toBeInTheDocument();
    expect(screen.getByText("Videos cached")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("renders Sync Now button", () => {
    render(<SyncStatus summary={mockSummary} recentLogs={mockLogs} />);

    const button = screen.getByRole("button", { name: /sync now/i });
    expect(button).toBeInTheDocument();
  });

  it("renders recent sync logs", () => {
    render(<SyncStatus summary={mockSummary} recentLogs={mockLogs} />);

    expect(screen.getByText("Recent Sync Logs")).toBeInTheDocument();
    // Check that log entries exist (manual and auto types)
    const logEntries = screen.getAllByText(/ch,.*new/);
    expect(logEntries).toHaveLength(2);
  });

  it("calls syncVideos when Sync Now is clicked", async () => {
    mockSyncVideos.mockResolvedValue({
      success: true,
      message: "Synced 5 videos",
      syncedCount: 5,
    });

    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<SyncStatus summary={mockSummary} recentLogs={mockLogs} />);

    const button = screen.getByRole("button", { name: /sync now/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSyncVideos).toHaveBeenCalled();
    });
  });

  it("shows loading state during sync", async () => {
    mockSyncVideos.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<SyncStatus summary={mockSummary} recentLogs={mockLogs} />);

    const button = screen.getByRole("button", { name: /sync now/i });
    fireEvent.click(button);

    expect(screen.getByText(/syncing/i)).toBeInTheDocument();
  });

  it("displays error logs with error indicator", () => {
    const logsWithError = [
      {
        id: 1,
        type: "auto",
        status: "error",
        channelsSynced: 0,
        newVideos: 0,
        apiUnitsUsed: 0,
        errors: JSON.stringify([{ error: "API Error" }]),
        duration: 5,
        triggeredBy: "cron",
        createdAt: new Date(),
      },
    ];

    render(<SyncStatus summary={mockSummary} recentLogs={logsWithError} />);

    expect(screen.getByText(/1 errors/i)).toBeInTheDocument();
  });

  it("displays skipped sync with appropriate message", () => {
    const logsWithSkipped = [
      {
        id: 1,
        type: "auto",
        status: "skipped",
        channelsSynced: 0,
        newVideos: 0,
        apiUnitsUsed: 0,
        errors: null,
        duration: 0,
        triggeredBy: "cron",
        createdAt: new Date(),
      },
    ];

    render(<SyncStatus summary={mockSummary} recentLogs={logsWithSkipped} />);

    expect(screen.getByText(/skipped.*recent sync/i)).toBeInTheDocument();
  });

  it("handles empty logs gracefully", () => {
    render(<SyncStatus summary={mockSummary} recentLogs={[]} />);

    expect(screen.queryByText("Recent Sync Logs")).not.toBeInTheDocument();
  });

  it("shows 'Never' when no last sync exists", () => {
    const summaryNoSync = {
      lastSync: null,
      nextAutoSync: null,
      channelCount: 5,
      totalVideos: 0,
    };

    render(<SyncStatus summary={summaryNoSync} recentLogs={[]} />);

    expect(screen.getByText("Never")).toBeInTheDocument();
  });

  it("shows 'Due now' when next sync is due", () => {
    const summaryDueNow = {
      ...mockSummary,
      nextAutoSync: null,
    };

    render(<SyncStatus summary={summaryDueNow} recentLogs={mockLogs} />);

    expect(screen.getByText("Due now")).toBeInTheDocument();
  });
});
