import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GlassButton } from "../../../../packages/ui/src/components/glass-button";
import { GlassSegmentedControl } from "../../../../packages/ui/src/components/glass-segmented-control";
import { Glass } from "../../../../packages/ui/src/components/glass";
import { GlassMotifField } from "../../../../packages/ui/src/components/glass-motif-field";
import { HeroLens } from "../../../../packages/ui/src/components/hero-lens";
import { ThemeToggle } from "../../../../packages/ui/src/components/theme-toggle";
import { THEME_STORAGE_KEY } from "../../../../packages/ui/src/theme/resolution";
import { resetRefractionBudgetForTests } from "../../../../packages/ui/src/glass/capabilities";
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

beforeEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  resetRefractionBudgetForTests();
  window.localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.dataset.theme = "light";
});

describe("FR-PUB-00 component acceptance", () => {
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

  it("round-trips light and dark five times without losing the persisted theme", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("button", {
      name: "Toggle color theme",
    });

    for (let roundTrip = 0; roundTrip < 5; roundTrip += 1) {
      fireEvent.click(toggle);
      expect(document.documentElement.dataset.theme).toBe("dark");
      fireEvent.click(toggle);
      expect(document.documentElement.dataset.theme).toBe("light");
    }

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
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
    expect(backing).toBeEmptyDOMElement();
    expect(within(backing).queryByRole("radio")).not.toBeInTheDocument();

    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(delivery).toHaveFocus();
    expect(delivery).toHaveAttribute("aria-checked", "true");
    expect(overview).toHaveAttribute("aria-checked", "false");
  });

  it("renders all GlassButton variants with secondary as the default", () => {
    render(
      <>
        <GlassButton>Default</GlassButton>
        <GlassButton variant="primary">Primary</GlassButton>
        <GlassButton variant="ghost">Ghost</GlassButton>
        <GlassButton variant="ghost" disabled>
          Disabled
        </GlassButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Default" })).toHaveClass(
      "eq-glass-button--secondary",
    );
    expect(screen.getByRole("button", { name: "Primary" })).toHaveClass(
      "eq-glass-button--primary",
    );
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveClass(
      "eq-glass-button--ghost",
    );
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("renders the corrected filter graph and updates region without regenerating the map", async () => {
    vi.useFakeTimers();
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: { supports: vi.fn(() => true) },
    });
    Object.defineProperty(window.navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 176,
      height: 176,
      left: 0,
      right: 176,
      top: 0,
      width: 176,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function getContext() {
        return {
          canvas: this,
          createImageData: (width: number, height: number) => ({
            data: new Uint8ClampedArray(width * height * 4),
            colorSpace: "srgb",
            height,
            width,
          }),
          drawImage: vi.fn(),
          filter: "none",
          getImageData: (_x: number, _y: number, width: number, height: number) => ({
            data: new Uint8ClampedArray(width * height * 4),
            colorSpace: "srgb",
            height,
            width,
          }),
          putImageData: vi.fn(),
        } as unknown as CanvasRenderingContext2D;
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,eqourse",
    );

    const { rerender } = render(
      <Glass activated data-testid="optical-glass" strength={24}>
        Refracted
      </Glass>,
    );
    await act(async () => {
      vi.runAllTimers();
    });

    const firstFilter = screen.getByTestId("glass-svg-filter")
      .querySelector("filter");
    const firstId = firstFilter?.id;
    const firstImage = firstFilter?.querySelector("feImage");
    const firstHref = firstImage?.getAttribute("href");

    expect(firstFilter?.querySelectorAll("feDisplacementMap")).toHaveLength(3);
    expect(firstFilter?.querySelector("feSpecularLighting")).toBeNull();
    expect(firstFilter?.querySelector("fePointLight")).toBeNull();
    expect(firstImage).toHaveAttribute("width", "176");
    expect(firstImage).toHaveAttribute("height", "176");
    expect(firstFilter?.querySelector("feFlood")).toHaveAttribute(
      "flood-color",
      "rgb(128,128,128)",
    );

    rerender(
      <Glass activated data-testid="optical-glass" strength={44}>
        Refracted
      </Glass>,
    );
    await act(async () => {
      vi.runAllTimers();
    });

    const secondFilter = screen.getByTestId("glass-svg-filter")
      .querySelector("filter");
    const secondImage = secondFilter?.querySelector("feImage");

    expect(secondFilter?.id).toBe(firstId);
    expect(secondImage?.getAttribute("href")).toBe(firstHref);
    expect(Number.parseFloat(secondFilter?.getAttribute("x") ?? "0")).toBeLessThan(
      -16,
    );
    expect(
      Number.parseFloat(secondFilter?.getAttribute("width") ?? "0"),
    ).toBeGreaterThan(132);
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

  it("renders GlassMotifField as decorative sharp-edged backing content", () => {
    render(<GlassMotifField data-testid="motif-field" />);

    const field = screen.getByTestId("motif-field");

    expect(field).toHaveAttribute("aria-hidden", "true");
    expect(
      field.querySelectorAll(".eq-motif-field__layer").length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("keeps the HeroLens backing copy hidden while real content stays outside the filtered subtree", () => {
    render(
      <HeroLens data-testid="hero-lens">
        <p>Real hero copy</p>
      </HeroLens>,
    );

    const hero = screen.getByTestId("hero-lens");
    const backing = hero.querySelector(".eq-hero-lens__backing");

    expect(backing).not.toBeNull();
    expect(backing).toHaveAttribute("aria-hidden", "true");
    expect(hero.querySelector(".eq-hero-lens__lens")).not.toBeNull();
    const copy = screen.getByText("Real hero copy");
    expect(backing?.contains(copy)).toBe(false);
    expect(
      copy.closest(".eq-glass__backing, .eq-hero-lens__backing"),
    ).toBeNull();
  });

  it("renders the hero lens showcase, three glass tiers, and a visible fourth-candidate fallback proof", () => {
    const { container } = render(<DesignSystemDemo />);

    expect(
      within(container as HTMLElement).getByTestId("hero-lens-showcase"),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-glass-visual-tier="regular"]')).toBeTruthy();
    expect(container.querySelector('[data-glass-visual-tier="clear"]')).toBeTruthy();
    expect(container.querySelector('[data-glass-visual-tier="focal"]')).toBeTruthy();
    expect(screen.getByTestId("focal-budget-candidate-4")).toHaveAttribute(
      "data-expected-tier",
      "frosted",
    );
    expect(
      screen.getByRole("button", { name: "Disabled glass" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "Sharp substrate carries brand colour through neutral glass.",
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".eq-glass-stage > .eq-glass-substrate"),
    ).toBeTruthy();
    expect(container.querySelector(".eq-glass-tier-comparison")).toBeTruthy();
    expect(
      container.querySelectorAll(".eq-glass-label-scrim").length,
    ).toBeGreaterThanOrEqual(5);
  });
});
