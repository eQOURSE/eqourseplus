import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GlassButton } from "../../../../packages/ui/src/components/glass-button";
import { GlassSegmentedControl } from "../../../../packages/ui/src/components/glass-segmented-control";
import { Glass } from "../../../../packages/ui/src/components/glass";
import { ThemeToggle } from "../../../../packages/ui/src/components/theme-toggle";
import { THEME_STORAGE_KEY } from "../../../../packages/ui/src/theme/resolution";
import { DesignSystemDemo } from "./design-system-demo";

const segmentOptions = [
  { value: "overview", label: "Overview" },
  { value: "delivery", label: "Delivery" },
  { value: "quality", label: "Quality" },
] as const;

function SegmentedControlHarness() {
  const [value, setValue] = useState("overview");

  return (
    <GlassSegmentedControl
      aria-label="Project view"
      options={segmentOptions}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe("FR-PUB-00 component acceptance", () => {
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => null,
    );
  });

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

describe("FR-PUB-00A interactive glass acceptance", () => {
  it("keeps the real segmented labels exposed and focusable while the backing copy is hidden", () => {
    render(<SegmentedControlHarness />);

    const overview = screen.getByRole("radio", { name: "Overview" });
    const delivery = screen.getByRole("radio", { name: "Delivery" });
    const backing = screen.getByTestId("glass-segmented-backing");

    expect(overview).toHaveAttribute("aria-checked", "true");
    expect(overview).toHaveAttribute("tabindex", "0");
    expect(delivery).toHaveAttribute("tabindex", "-1");
    expect(backing).toHaveAttribute("aria-hidden", "true");
    expect(within(backing).getByText("Overview")).toBeInTheDocument();
    expect(within(backing).queryByRole("radio")).not.toBeInTheDocument();

    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(delivery).toHaveFocus();
    expect(delivery).toHaveAttribute("aria-checked", "true");
    expect(overview).toHaveAttribute("aria-checked", "false");
  });

  it("updates GlassButton specular variables from pointer events without an animation loop", () => {
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");
    const hardwareConcurrency = vi
      .spyOn(window.navigator, "hardwareConcurrency", "get")
      .mockReturnValue(8);
    window.PointerEvent = MouseEvent as typeof PointerEvent;

    render(<GlassButton>Request access</GlassButton>);
    const button = screen.getByRole("button", { name: "Request access" });
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
      bottom: 80,
      height: 80,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerEnter(button);
    fireEvent.pointerMove(button, { clientX: 50, clientY: 20 });

    expect(button.style.getPropertyValue("--glass-pointer-x")).toBe("25%");
    expect(button.style.getPropertyValue("--glass-pointer-y")).toBe("25%");
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    hardwareConcurrency.mockRestore();
    requestAnimationFrame.mockRestore();
  });

  it("keeps GlassButton specular static on low-end devices", () => {
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");
    const hardwareConcurrency = vi
      .spyOn(window.navigator, "hardwareConcurrency", "get")
      .mockReturnValue(4);
    window.PointerEvent = MouseEvent as typeof PointerEvent;

    render(<GlassButton>Low-end action</GlassButton>);
    const button = screen.getByRole("button", { name: "Low-end action" });
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
      bottom: 80,
      height: 80,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerEnter(button);
    fireEvent.pointerMove(button, { clientX: 50, clientY: 20 });

    expect(button.style.getPropertyValue("--glass-pointer-x")).toBe("");
    expect(button.style.getPropertyValue("--glass-pointer-y")).toBe("");
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    hardwareConcurrency.mockRestore();
    requestAnimationFrame.mockRestore();
  });

  it("renders the three glass tiers and a visible fourth-candidate fallback proof", () => {
    const { container } = render(<DesignSystemDemo />);

    expect(container.querySelector('[data-glass-visual-tier="regular"]')).toBeTruthy();
    expect(container.querySelector('[data-glass-visual-tier="clear"]')).toBeTruthy();
    expect(container.querySelector('[data-glass-visual-tier="focal"]')).toBeTruthy();
    expect(screen.getByTestId("focal-budget-candidate-4")).toHaveAttribute(
      "data-expected-tier",
      "frosted",
    );
  });
});
