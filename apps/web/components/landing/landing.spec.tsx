import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { contrast, parseHsl } from "../../../../packages/ui/test/contrast-helpers";
import { HomeHeader, PUBLIC_CHROME_HREFS } from "../home/HomeChrome";
import { CockpitPreview } from "./cockpit";
import { Faq, FinalCta } from "./faq-cta";
import { GlassBox } from "./glass-box";
import { LiquidLens, supportsBackdropRefraction } from "./liquid-lens";
import { SEGMENTS } from "./segments";
import { SpecializationTracks } from "./tracks";

const css = (file: string) =>
  readFileSync(resolve(process.cwd(), `components/landing/${file}`), "utf8");
const landingCss = css("landing.css");
const sectionsCss = css("sections.css");
const chromeCss = css("chrome.css");

function themeBlock(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return landingCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

function token(block: string, name: string) {
  const value = block.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
  if (!value) throw new Error(`missing --${name}`);
  return parseHsl(value);
}

afterEach(cleanup);

describe("segment CTAs", () => {
  it("defines exactly the three audiences with registration and learn-more routes", () => {
    expect(SEGMENTS.map((item) => [item.cta, item.href, item.learnMoreHref])).toEqual([
      ["Apply as an Expert", "/register/freelancer", "/freelancers"],
      ["Join as a Vendor", "/register/vendor", "/vendors"],
      ["Deploy Expert Teams", "/register/client", "/clients"],
    ]);
  });

  it("puts all three segments plus Login in the shared header on every page", () => {
    const { container } = render(<HomeHeader />);
    const nav = container.querySelector("#site-navigation")!;
    for (const item of SEGMENTS) {
      expect(within(nav as HTMLElement).getByRole("link", { name: new RegExp(item.cta) })).toHaveAttribute("href", item.href);
    }
    expect(within(nav as HTMLElement).getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    for (const item of SEGMENTS) expect(PUBLIC_CHROME_HREFS).toContain(item.href);
  });

  it("repeats the same three CTAs in the final call to action", () => {
    render(<FinalCta />);
    for (const item of SEGMENTS) {
      expect(screen.getByRole("link", { name: new RegExp(item.cta) })).toHaveAttribute("href", item.href);
    }
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });
});

describe("theme switch", () => {
  it("flips the document theme and persists the choice", () => {
    document.documentElement.dataset.theme = "light";
    render(<HomeHeader />);
    const toggle = screen.getByRole("switch", { name: "Dark theme" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("eqourse-theme")).toBe("dark");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("cockpit preview", () => {
  it("switches between accessible bar, line, and pie chart panels", async () => {
    render(<CockpitPreview />);
    const barTab = screen.getByRole("tab", { name: "Bar chart" });
    expect(barTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Bar chart");
    await waitFor(() => expect(screen.getByLabelText("Weekly throughput bar chart")).toBeVisible());

    fireEvent.click(screen.getByRole("tab", { name: "Line chart" }));
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Line chart");
    await waitFor(() => expect(screen.getByLabelText("Weekly throughput line chart")).toBeVisible());

    fireEvent.click(screen.getByRole("tab", { name: "Pie chart" }));
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Pie chart");
    await waitFor(() => expect(screen.getByLabelText("Project status pie chart")).toBeVisible());
  });

  it("supports arrow-key navigation across the chart tabs", () => {
    render(<CockpitPreview />);
    const barTab = screen.getByRole("tab", { name: "Bar chart" });
    fireEvent.keyDown(barTab, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Line chart" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(barTab, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Pie chart" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("specialization orbit", () => {
  it("selects a track by click and by arrow key and updates the detail panel", async () => {
    render(<SpecializationTracks />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(8);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: /Clinical medicine and healthcare/ }));
    await waitFor(() =>
      expect(screen.getByRole("tabpanel")).toHaveTextContent("Diagnostic review, pharmacology evaluation"),
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: /Clinical medicine/ }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /Curriculum design/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Track 06 of 08");
  });
});

describe("glass box comparison", () => {
  it("keeps a semantic comparison table and toggles the highlighted model", () => {
    const { container } = render(<GlassBox />);
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Operational area",
      "Legacy crowdsourcing platforms",
      "The eQOURSE+ glass-box standard",
    ]);
    expect(screen.getAllByRole("rowheader")).toHaveLength(5);

    const legacy = screen.getByRole("button", { name: "Legacy platforms" });
    const standard = screen.getByRole("button", { name: "eQOURSE+ standard" });
    fireEvent.click(standard);
    expect(standard).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".lx-gb")).toHaveAttribute("data-mode", "glass");
    fireEvent.click(legacy);
    expect(legacy).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".lx-gb")).toHaveAttribute("data-mode", "legacy");
  });
});

describe("FAQ", () => {
  it("renders native, keyboard-operable disclosure items with the first open", () => {
    const { container } = render(<Faq />);
    const items = container.querySelectorAll("details");
    expect(items).toHaveLength(7);
    expect(items[0]).toHaveAttribute("open");
    expect(container.querySelectorAll("summary")).toHaveLength(7);
    expect(screen.getByText(/enterprise clients on real projects/i)).toBeInTheDocument();
    expect(screen.getByText(/which countries can experts work from/i)).toBeInTheDocument();
  });

  it("wraps long questions and offsets anchored sections below the floating nav", () => {
    expect(sectionsCss).toMatch(/\.lx-qa__q\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(sectionsCss).toMatch(/\.lx-home section\[id\]\s*\{[^}]*scroll-margin-top/);
  });
});

describe("liquid glass", () => {
  it("falls back to frosted glass where refraction is unsupported", () => {
    expect(supportsBackdropRefraction()).toBe(false);
    const { container } = render(<LiquidLens className="lx-glass">content</LiquidLens>);
    const lens = container.firstElementChild!;
    expect(lens).toHaveAttribute("data-lens", "frosted");
    expect(lens).not.toHaveClass("lx-refract");
    expect(lens.querySelector("filter")).toBeNull();
  });
});

describe("design system", () => {
  it.each([
    ["light", ':root,\n[data-theme="light"]'],
    ["dark", '[data-theme="dark"]'],
  ] as const)("keeps %s text tokens AA against the page background", (_theme, selector) => {
    const block = themeBlock(selector);
    const bg = token(block, "lx-bg");
    expect(contrast(token(block, "lx-ink"), bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(token(block, "lx-ink-2"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(block, "lx-ink-3"), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("rests every animation and reveals all content under reduced motion", () => {
    const reduced = landingCss.slice(landingCss.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(reduced).toMatch(/\.lx-js \.lx-reveal\s*\{[^}]*opacity:\s*1/);
  });

  it("only hides reveal content once JavaScript has marked the document", () => {
    expect(landingCss).toMatch(/\.lx-js \.lx-reveal\s*\{[^}]*opacity:\s*0/);
    expect(landingCss).not.toMatch(/(^|\n)\.lx-reveal\s*\{[^}]*opacity:\s*0/);
  });

  it("keeps 48px touch targets on the nav toggle, theme switch and buttons", () => {
    expect(chromeCss).toMatch(/\.lx-nav__toggle\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px/);
    expect(chromeCss).toMatch(/\.lx-theme\s*\{[^}]*height:\s*48px/);
    expect(landingCss).toMatch(/\.lx-btn\s*\{[^}]*min-height:\s*3rem/);
    expect(chromeCss).toMatch(/\.lx-footer__cta\s*\{[^}]*min-height:\s*48px/);
  });
});
