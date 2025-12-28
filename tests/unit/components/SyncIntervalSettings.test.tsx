import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncIntervalSettings } from "@/components/SyncIntervalSettings";

// Mock the updateSyncInterval action
const mockUpdateSyncInterval = vi.fn();
vi.mock("@/actions/settings", () => ({
  updateSyncInterval: (hours: number) => mockUpdateSyncInterval(hours),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("SyncIntervalSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders interval selector with all options", () => {
    render(<SyncIntervalSettings initialInterval={6} />);

    expect(screen.getByText("Auto-sync interval")).toBeInTheDocument();
    expect(screen.getByText("How often to fetch new videos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3h" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6h" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12h" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "24h" })).toBeInTheDocument();
  });

  it("shows 6h as selected when initialInterval is 6", () => {
    render(<SyncIntervalSettings initialInterval={6} />);

    const button6h = screen.getByRole("button", { name: "6h" });
    expect(button6h).toHaveAttribute("aria-pressed", "true");
  });

  it("shows 3h as selected when initialInterval is 3", () => {
    render(<SyncIntervalSettings initialInterval={3} />);

    const button3h = screen.getByRole("button", { name: "3h" });
    expect(button3h).toHaveAttribute("aria-pressed", "true");
  });

  it("shows 12h as selected when initialInterval is 12", () => {
    render(<SyncIntervalSettings initialInterval={12} />);

    const button12h = screen.getByRole("button", { name: "12h" });
    expect(button12h).toHaveAttribute("aria-pressed", "true");
  });

  it("shows 24h as selected when initialInterval is 24", () => {
    render(<SyncIntervalSettings initialInterval={24} />);

    const button24h = screen.getByRole("button", { name: "24h" });
    expect(button24h).toHaveAttribute("aria-pressed", "true");
  });

  it("updates interval when clicking a different option", async () => {
    const user = userEvent.setup();
    mockUpdateSyncInterval.mockResolvedValue({});

    render(<SyncIntervalSettings initialInterval={6} />);

    const button3h = screen.getByRole("button", { name: "3h" });
    await user.click(button3h);

    await waitFor(() => {
      expect(mockUpdateSyncInterval).toHaveBeenCalledWith(3);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Sync interval updated",
        description: "Auto-sync will now run every 3 hours.",
      });
    });
  });

  it("updates to 24h interval", async () => {
    const user = userEvent.setup();
    mockUpdateSyncInterval.mockResolvedValue({});

    render(<SyncIntervalSettings initialInterval={6} />);

    const button24h = screen.getByRole("button", { name: "24h" });
    await user.click(button24h);

    await waitFor(() => {
      expect(mockUpdateSyncInterval).toHaveBeenCalledWith(24);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Sync interval updated",
        description: "Auto-sync will now run every 24 hours.",
      });
    });
  });

  it("does not call updateSyncInterval when clicking already selected interval", async () => {
    const user = userEvent.setup();

    render(<SyncIntervalSettings initialInterval={6} />);

    const button6h = screen.getByRole("button", { name: "6h" });
    await user.click(button6h);

    expect(mockUpdateSyncInterval).not.toHaveBeenCalled();
  });

  it("shows error toast when update fails", async () => {
    const user = userEvent.setup();
    mockUpdateSyncInterval.mockRejectedValue(new Error("Network error"));

    render(<SyncIntervalSettings initialInterval={6} />);

    const button3h = screen.getByRole("button", { name: "3h" });
    await user.click(button3h);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to update interval",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    });
  });

  it("reverts to previous interval on error", async () => {
    const user = userEvent.setup();
    mockUpdateSyncInterval.mockRejectedValue(new Error("Network error"));

    render(<SyncIntervalSettings initialInterval={6} />);

    const button3h = screen.getByRole("button", { name: "3h" });
    await user.click(button3h);

    await waitFor(() => {
      // After error, 6h should still be selected
      const button6h = screen.getByRole("button", { name: "6h" });
      expect(button6h).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("displays clock icon", () => {
    render(<SyncIntervalSettings initialInterval={6} />);

    const orangeIconContainer = document.querySelector(".bg-orange-100");
    expect(orangeIconContainer).toBeInTheDocument();
  });
});
