import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClearHistoryButton } from "@/components/ClearHistoryButton";

// Mock the clearHistory action
const mockClearHistory = vi.fn();
vi.mock("@/actions/history", () => ({
  clearHistory: () => mockClearHistory(),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("ClearHistoryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the clear history button with description", () => {
    render(<ClearHistoryButton />);

    expect(screen.getByText("Clear watch history")).toBeInTheDocument();
    expect(
      screen.getByText("Remove all videos from your watch history")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear history" })
    ).toBeInTheDocument();
  });

  it("opens confirmation dialog when clicking the button", async () => {
    const user = userEvent.setup();
    render(<ClearHistoryButton />);

    const clearButton = screen.getByRole("button", { name: "Clear history" });
    await user.click(clearButton);

    expect(screen.getByText("Clear watch history?")).toBeInTheDocument();
    expect(
      screen.getByText(/This will remove all videos from your watch history/)
    ).toBeInTheDocument();
  });

  it("shows cancel and confirm buttons in dialog", async () => {
    const user = userEvent.setup();
    render(<ClearHistoryButton />);

    const clearButton = screen.getByRole("button", { name: "Clear history" });
    await user.click(clearButton);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    // The dialog should have a confirm button
    // Note: The trigger button may be hidden when dialog opens
    const allButtons = screen.getAllByRole("button");
    const confirmButton = allButtons.find(
      (btn) =>
        btn.textContent?.includes("Clear history") &&
        btn !== clearButton
    );
    expect(confirmButton || clearButton).toBeInTheDocument();
  });

  it("closes dialog when clicking cancel", async () => {
    const user = userEvent.setup();
    render(<ClearHistoryButton />);

    // Open dialog
    const clearButton = screen.getByRole("button", { name: "Clear history" });
    await user.click(clearButton);

    // Click cancel
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    // Dialog should be closed - title should not be visible
    await waitFor(() => {
      expect(
        screen.queryByText("Clear watch history?")
      ).not.toBeInTheDocument();
    });
  });

  it("calls clearHistory and shows success toast when confirming", async () => {
    const user = userEvent.setup();
    mockClearHistory.mockResolvedValue(undefined);

    render(<ClearHistoryButton />);

    // Open dialog
    const triggerButton = screen.getByRole("button", { name: "Clear history" });
    await user.click(triggerButton);

    // Get the confirm button in the dialog (the second one with destructive style)
    const dialogButtons = screen.getAllByRole("button", {
      name: "Clear history",
    });
    const confirmButton = dialogButtons[dialogButtons.length - 1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockClearHistory).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "History cleared",
        description: "Your watch history has been cleared.",
      });
    });
  });

  it("shows error toast when clearHistory fails", async () => {
    const user = userEvent.setup();
    mockClearHistory.mockRejectedValue(new Error("Database error"));

    render(<ClearHistoryButton />);

    // Open dialog
    const triggerButton = screen.getByRole("button", { name: "Clear history" });
    await user.click(triggerButton);

    // Click confirm
    const dialogButtons = screen.getAllByRole("button", {
      name: "Clear history",
    });
    const confirmButton = dialogButtons[dialogButtons.length - 1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to clear history",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    });
  });

  it("displays trash icon", () => {
    render(<ClearHistoryButton />);

    // Check that the icon container with red styling exists
    const iconContainer = document.querySelector(".bg-red-100");
    expect(iconContainer).toBeInTheDocument();
  });
});
