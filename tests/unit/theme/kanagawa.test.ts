import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Kanagawa Dragon color palette (dark mode)
const KANAGAWA_DRAGON = {
  background: "#0d0c0c",
  backgroundAlt: "#12120f",
  foreground: "#c5c9c5",
  foregroundDim: "#a6a69c",
  card: "#1D1C19",
  primary: "#7E9CD8",
  secondary: "#1D1C19",
  success: "#98BB6C",
  warning: "#E6C384",
  destructive: "#C34043",
  info: "#7FB4CA",
  border: "#282727", // dragonBlack4
};

// Kanagawa Lotus color palette (light mode)
const KANAGAWA_LOTUS = {
  background: "#f2ecbc",
  backgroundAlt: "#e7dba0",
  foreground: "#1f1f28",
  foregroundDim: "#545464",
  card: "#dcd5ac",
  primary: "#4d699b",
  secondary: "#e7dba0",
  success: "#6f894e",
  warning: "#de9800",
  destructive: "#c84053",
  info: "#4d699b",
  border: "#c9b97e",
};

// Category colors inspired by Kanagawa
const KANAGAWA_CATEGORY_COLORS = [
  { name: "Crystal Blue", value: "#7E9CD8" },
  { name: "Spring Green", value: "#98BB6C" },
  { name: "Oni Violet", value: "#957FB8" },
  { name: "Surimi Orange", value: "#FFA066" },
  { name: "Sakura Pink", value: "#D27E99" },
  { name: "Spring Blue", value: "#7FB4CA" },
  { name: "Autumn Red", value: "#C34043" },
  { name: "Carp Yellow", value: "#E6C384" },
];

describe("Kanagawa Theme", () => {
  describe("CSS Variables in globals.css", () => {
    const globalsPath = path.join(process.cwd(), "app/globals.css");
    const globalsContent = fs.readFileSync(globalsPath, "utf-8");

    describe("Light Mode (Kanagawa Lotus)", () => {
      it("should define correct background color", () => {
        expect(globalsContent).toContain(`--background: ${KANAGAWA_LOTUS.background}`);
      });

      it("should define correct background-alt color", () => {
        expect(globalsContent).toContain(`--background-alt: ${KANAGAWA_LOTUS.backgroundAlt}`);
      });

      it("should define correct foreground color", () => {
        expect(globalsContent).toContain(`--foreground: ${KANAGAWA_LOTUS.foreground}`);
      });

      it("should define correct primary color", () => {
        expect(globalsContent).toContain(`--primary: ${KANAGAWA_LOTUS.primary}`);
      });

      it("should define correct success color", () => {
        expect(globalsContent).toContain(`--success: ${KANAGAWA_LOTUS.success}`);
      });

      it("should define correct warning color", () => {
        expect(globalsContent).toContain(`--warning: ${KANAGAWA_LOTUS.warning}`);
      });

      it("should define correct destructive color", () => {
        expect(globalsContent).toContain(`--destructive: ${KANAGAWA_LOTUS.destructive}`);
      });

      it("should define correct border color", () => {
        expect(globalsContent).toContain(`--border: ${KANAGAWA_LOTUS.border}`);
      });
    });

    describe("Dark Mode (Kanagawa Dragon)", () => {
      it("should define correct background color in .dark", () => {
        expect(globalsContent).toContain(`--background: ${KANAGAWA_DRAGON.background}`);
      });

      it("should define correct background-alt color in .dark", () => {
        expect(globalsContent).toContain(`--background-alt: ${KANAGAWA_DRAGON.backgroundAlt}`);
      });

      it("should define correct foreground color in .dark", () => {
        expect(globalsContent).toContain(`--foreground: ${KANAGAWA_DRAGON.foreground}`);
      });

      it("should define correct primary color in .dark", () => {
        expect(globalsContent).toContain(`--primary: ${KANAGAWA_DRAGON.primary}`);
      });

      it("should define correct success color in .dark", () => {
        expect(globalsContent).toContain(`--success: ${KANAGAWA_DRAGON.success}`);
      });

      it("should define correct warning color in .dark", () => {
        expect(globalsContent).toContain(`--warning: ${KANAGAWA_DRAGON.warning}`);
      });

      it("should define correct destructive color in .dark", () => {
        expect(globalsContent).toContain(`--destructive: ${KANAGAWA_DRAGON.destructive}`);
      });

      it("should define correct border color in .dark", () => {
        expect(globalsContent).toContain(`--border: ${KANAGAWA_DRAGON.border}`);
      });
    });

    describe("Semantic Color Variables", () => {
      it("should define info color variable", () => {
        expect(globalsContent).toContain("--info:");
      });

      it("should define info-foreground color variable", () => {
        expect(globalsContent).toContain("--info-foreground:");
      });

      it("should define success-foreground color variable", () => {
        expect(globalsContent).toContain("--success-foreground:");
      });

      it("should define warning-foreground color variable", () => {
        expect(globalsContent).toContain("--warning-foreground:");
      });
    });

    describe("Theme Mapping (@theme inline)", () => {
      it("should map --color-success to --success", () => {
        expect(globalsContent).toContain("--color-success: var(--success)");
      });

      it("should map --color-warning to --warning", () => {
        expect(globalsContent).toContain("--color-warning: var(--warning)");
      });

      it("should map --color-info to --info", () => {
        expect(globalsContent).toContain("--color-info: var(--info)");
      });

      it("should map --color-background-alt to --background-alt", () => {
        expect(globalsContent).toContain("--color-background-alt: var(--background-alt)");
      });

      it("should map --color-foreground-dim to --foreground-dim", () => {
        expect(globalsContent).toContain("--color-foreground-dim: var(--foreground-dim)");
      });
    });
  });

  describe("CategoryManager Colors", () => {
    const categoryManagerPath = path.join(process.cwd(), "components/CategoryManager.tsx");
    const categoryManagerContent = fs.readFileSync(categoryManagerPath, "utf-8");

    it("should include Crystal Blue color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[0].value);
    });

    it("should include Spring Green color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[1].value);
    });

    it("should include Oni Violet color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[2].value);
    });

    it("should include Surimi Orange color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[3].value);
    });

    it("should include Sakura Pink color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[4].value);
    });

    it("should include Spring Blue color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[5].value);
    });

    it("should include Autumn Red color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[6].value);
    });

    it("should include Carp Yellow color", () => {
      expect(categoryManagerContent).toContain(KANAGAWA_CATEGORY_COLORS[7].value);
    });

    it("should NOT include old hardcoded blue color", () => {
      expect(categoryManagerContent).not.toContain("#3B82F6");
    });

    it("should NOT include old hardcoded green color", () => {
      expect(categoryManagerContent).not.toContain("#22C55E");
    });
  });

  describe("Layout Theme Color", () => {
    const layoutPath = path.join(process.cwd(), "app/layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    it("should use Kanagawa Dragon sumiInk0 as themeColor", () => {
      expect(layoutContent).toContain(`themeColor: "${KANAGAWA_DRAGON.background}"`);
    });
  });
});

describe("Component Theme Consistency", () => {
  describe("Button Component", () => {
    const buttonPath = path.join(process.cwd(), "components/ui/button.tsx");
    const buttonContent = fs.readFileSync(buttonPath, "utf-8");

    it("should use bg-primary for default variant", () => {
      expect(buttonContent).toContain("bg-primary");
    });

    it("should use text-primary-foreground for default variant", () => {
      expect(buttonContent).toContain("text-primary-foreground");
    });

    it("should use bg-destructive for destructive variant", () => {
      expect(buttonContent).toContain("bg-destructive");
    });

    it("should use focus-visible:ring-ring instead of hardcoded blue", () => {
      expect(buttonContent).toContain("focus-visible:ring-ring");
      expect(buttonContent).not.toContain("focus-visible:ring-blue-500");
    });

    it("should NOT contain hardcoded gray colors", () => {
      expect(buttonContent).not.toContain("bg-gray-100");
      expect(buttonContent).not.toContain("dark:bg-gray-800");
    });
  });

  describe("Input Component", () => {
    const inputPath = path.join(process.cwd(), "components/ui/input.tsx");
    const inputContent = fs.readFileSync(inputPath, "utf-8");

    it("should use border-border instead of hardcoded gray", () => {
      expect(inputContent).toContain("border-border");
      expect(inputContent).not.toContain("border-gray-300");
    });

    it("should use bg-card instead of hardcoded colors", () => {
      expect(inputContent).toContain("bg-card");
      expect(inputContent).not.toContain("bg-white");
    });

    it("should use focus-visible:ring-ring", () => {
      expect(inputContent).toContain("focus-visible:ring-ring");
      expect(inputContent).not.toContain("focus-visible:ring-blue-500");
    });
  });

  describe("Badge Component", () => {
    const badgePath = path.join(process.cwd(), "components/ui/badge.tsx");
    const badgeContent = fs.readFileSync(badgePath, "utf-8");

    it("should use bg-primary for default variant", () => {
      expect(badgeContent).toContain("bg-primary");
    });

    it("should use bg-success for success variant", () => {
      expect(badgeContent).toContain("bg-success");
    });

    it("should use bg-warning for warning variant", () => {
      expect(badgeContent).toContain("bg-warning");
    });

    it("should NOT contain hardcoded color classes", () => {
      expect(badgeContent).not.toContain("bg-blue-600");
      expect(badgeContent).not.toContain("bg-green-600");
      expect(badgeContent).not.toContain("bg-yellow-500");
    });
  });

  describe("Card Component", () => {
    const cardPath = path.join(process.cwd(), "components/ui/card.tsx");
    const cardContent = fs.readFileSync(cardPath, "utf-8");

    it("should use border-border", () => {
      expect(cardContent).toContain("border-border");
    });

    it("should use bg-card", () => {
      expect(cardContent).toContain("bg-card");
    });

    it("should use text-muted-foreground for description", () => {
      expect(cardContent).toContain("text-muted-foreground");
    });

    it("should NOT contain hardcoded dark mode colors", () => {
      expect(cardContent).not.toContain("dark:border-gray-800");
      expect(cardContent).not.toContain("dark:bg-gray-900");
    });
  });

  describe("Progress Component", () => {
    const progressPath = path.join(process.cwd(), "components/ui/progress.tsx");
    const progressContent = fs.readFileSync(progressPath, "utf-8");

    it("should use bg-secondary for track", () => {
      expect(progressContent).toContain("bg-secondary");
    });

    it("should use bg-primary for indicator", () => {
      expect(progressContent).toContain("bg-primary");
    });

    it("should NOT contain hardcoded colors", () => {
      expect(progressContent).not.toContain("bg-gray-200");
      expect(progressContent).not.toContain("bg-blue-600");
    });
  });

  describe("Empty State Component", () => {
    const emptyStatePath = path.join(process.cwd(), "components/ui/empty-state.tsx");
    const emptyStateContent = fs.readFileSync(emptyStatePath, "utf-8");

    it("should use bg-muted for icon container", () => {
      expect(emptyStateContent).toContain("bg-muted");
    });

    it("should use text-muted-foreground", () => {
      expect(emptyStateContent).toContain("text-muted-foreground");
    });

    it("should use text-foreground for title", () => {
      expect(emptyStateContent).toContain("text-foreground");
    });

    it("should NOT contain hardcoded gray colors", () => {
      expect(emptyStateContent).not.toContain("bg-gray-100");
      expect(emptyStateContent).not.toContain("text-gray-400");
    });
  });
});

describe("Page Theme Consistency", () => {
  describe("Settings Page", () => {
    const settingsPath = path.join(process.cwd(), "app/settings/page.tsx");
    const settingsContent = fs.readFileSync(settingsPath, "utf-8");

    it("should use bg-muted for sections", () => {
      expect(settingsContent).toContain("bg-muted");
    });

    it("should use border-border", () => {
      expect(settingsContent).toContain("border-border");
    });

    it("should use text-muted-foreground", () => {
      expect(settingsContent).toContain("text-muted-foreground");
    });

    it("should NOT contain hardcoded gray background", () => {
      expect(settingsContent).not.toContain("bg-gray-50");
      expect(settingsContent).not.toContain("dark:bg-gray-900");
    });
  });

  describe("Stats Page", () => {
    const statsPath = path.join(process.cwd(), "app/stats/page.tsx");
    const statsContent = fs.readFileSync(statsPath, "utf-8");

    it("should use semantic color bg-success/10", () => {
      expect(statsContent).toContain("bg-success/10");
    });

    it("should use semantic color bg-warning/10", () => {
      expect(statsContent).toContain("bg-warning/10");
    });

    it("should use semantic color bg-destructive/10", () => {
      expect(statsContent).toContain("bg-destructive/10");
    });

    it("should use text-muted-foreground for secondary text", () => {
      expect(statsContent).toContain("text-muted-foreground");
    });

    it("should NOT contain hardcoded orange/green/red backgrounds", () => {
      expect(statsContent).not.toContain("bg-orange-50");
      expect(statsContent).not.toContain("bg-green-50");
      expect(statsContent).not.toContain("bg-red-50");
    });
  });

  describe("History Page", () => {
    const historyPath = path.join(process.cwd(), "app/history/page.tsx");
    const historyContent = fs.readFileSync(historyPath, "utf-8");

    it("should use bg-info/20 for icon container", () => {
      expect(historyContent).toContain("bg-info/20");
    });

    it("should use text-info for icon", () => {
      expect(historyContent).toContain("text-info");
    });

    it("should use text-muted-foreground for description", () => {
      expect(historyContent).toContain("text-muted-foreground");
    });
  });

  describe("Watch Later Page", () => {
    const watchLaterPath = path.join(process.cwd(), "app/watch-later/page.tsx");
    const watchLaterContent = fs.readFileSync(watchLaterPath, "utf-8");

    it("should use bg-success/20 for icon container", () => {
      expect(watchLaterContent).toContain("bg-success/20");
    });

    it("should use text-success for icon", () => {
      expect(watchLaterContent).toContain("text-success");
    });

    it("should NOT contain hardcoded green colors", () => {
      expect(watchLaterContent).not.toContain("bg-green-100");
      expect(watchLaterContent).not.toContain("text-green-600");
    });
  });
});

describe("No Deprecated Color Patterns", () => {
  const filesToCheck = [
    "app/globals.css",
    "components/ui/button.tsx",
    "components/ui/input.tsx",
    "components/ui/badge.tsx",
    "components/ui/card.tsx",
    "components/ui/progress.tsx",
    "components/CategoryManager.tsx",
  ];

  it("should not use deprecated @media (prefers-color-scheme: dark) in globals.css", () => {
    const globalsPath = path.join(process.cwd(), "app/globals.css");
    const globalsContent = fs.readFileSync(globalsPath, "utf-8");

    // Check that the deprecated media query is not used for color definitions
    const deprecatedPattern = /@media \(prefers-color-scheme: dark\)\s*{\s*:root\s*{/;
    expect(globalsContent).not.toMatch(deprecatedPattern);
  });

  it("should use .dark class for dark mode in globals.css", () => {
    const globalsPath = path.join(process.cwd(), "app/globals.css");
    const globalsContent = fs.readFileSync(globalsPath, "utf-8");

    expect(globalsContent).toContain(".dark {");
  });
});
