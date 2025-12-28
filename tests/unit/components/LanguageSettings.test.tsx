import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSettings } from "@/components/LanguageSettings";

// Mock the updateSettings action
const mockUpdateSettings = vi.fn();
vi.mock("@/actions/settings", () => ({
  updateSettings: (data: unknown) => mockUpdateSettings(data),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("LanguageSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders language selector and subtitles toggle", () => {
    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    expect(screen.getByText("Player language")).toBeInTheDocument();
    expect(screen.getByText("YouTube interface and subtitle preference")).toBeInTheDocument();
    expect(screen.getByText("Espanol")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Show subtitles automatically")).toBeInTheDocument();
  });

  it("shows Spanish as selected when initialLanguage is es", () => {
    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    const spanishButton = screen.getByRole("button", { name: "Espanol" });
    expect(spanishButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows English as selected when initialLanguage is en", () => {
    render(
      <LanguageSettings
        initialLanguage="en"
        initialAutoShowSubtitles={false}
      />
    );

    const englishButton = screen.getByRole("button", { name: "English" });
    expect(englishButton).toHaveAttribute("aria-pressed", "true");
  });

  it("updates language when clicking a different language", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});

    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    const englishButton = screen.getByRole("button", { name: "English" });
    await user.click(englishButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ preferredLanguage: "en" });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Language updated",
        description: "YouTube player will now display in English.",
      });
    });
  });

  it("does not call updateSettings when clicking already selected language", async () => {
    const user = userEvent.setup();

    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    const spanishButton = screen.getByRole("button", { name: "Espanol" });
    await user.click(spanishButton);

    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it("shows error toast when language update fails", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockRejectedValue(new Error("Network error"));

    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    const englishButton = screen.getByRole("button", { name: "English" });
    await user.click(englishButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to update language",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    });
  });

  it("toggles subtitles on", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});

    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    const subtitlesSwitch = screen.getByRole("switch", { name: "Show subtitles automatically" });
    await user.click(subtitlesSwitch);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoShowSubtitles: true });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Subtitles enabled",
        description: "Subtitles will be shown automatically when available.",
      });
    });
  });

  it("toggles subtitles off", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});

    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={true}
      />
    );

    const subtitlesSwitch = screen.getByRole("switch", { name: "Show subtitles automatically" });
    await user.click(subtitlesSwitch);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoShowSubtitles: false });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Subtitles disabled",
        description: "Subtitles will not be shown automatically.",
      });
    });
  });

  it("shows error toast when subtitles update fails", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockRejectedValue(new Error("Network error"));

    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    const subtitlesSwitch = screen.getByRole("switch", { name: "Show subtitles automatically" });
    await user.click(subtitlesSwitch);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to update settings",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    });
  });

  it("displays correct icons", () => {
    render(
      <LanguageSettings
        initialLanguage="es"
        initialAutoShowSubtitles={false}
      />
    );

    // Check that the icon containers exist
    const blueIconContainer = document.querySelector(".bg-blue-100");
    const greenIconContainer = document.querySelector(".bg-green-100");
    expect(blueIconContainer).toBeInTheDocument();
    expect(greenIconContainer).toBeInTheDocument();
  });
});
