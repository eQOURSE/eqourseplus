import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Glass } from "../../../../packages/ui/src/components/glass";
import { ThemeToggle } from "../../../../packages/ui/src/components/theme-toggle";
import { THEME_STORAGE_KEY } from "../../../../packages/ui/src/theme/resolution";

describe("FR-PUB-00 component acceptance", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.dataset.theme = "light";
  });

  it("renders Tier-1 frosted glass when refraction is disabled", () => {
    render(
      <Glass data-testid="glass" disabled>
        <span>Live rendered content</span>
      </Glass>,
    );

    expect(screen.getByTestId("glass")).toHaveAttribute(
      "data-glass-tier",
      "frosted",
    );
    expect(screen.getByText("Live rendered content")).toBeInTheDocument();
    expect(screen.queryByTestId("glass-svg-filter")).not.toBeInTheDocument();
  });

  it("persists the user's theme toggle and updates the root before reload", () => {
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle color theme" }),
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList).toContain("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });
});
