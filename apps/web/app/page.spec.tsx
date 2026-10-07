import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  contrastRgb,
  hslToRgb,
  parseHsl,
  resolveToken,
  themeDeclarations,
  worstAmbientSurface,
} from "../../../packages/ui/test/contrast-helpers";
import { primaryNavHrefs, PRIMARY_NAV_HREFS } from "../components/home/chrome-test-utils";
import { SEGMENTS } from "../components/landing/segments";
import HomePage from "./page";
import { EXCLUDED_ROUTES, RESOLVING_ROUTES } from "./public-routes";

const pageSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const landingStyles = readFileSync(
  resolve(process.cwd(), "components/landing/landing.css"),
  "utf8",
);
const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
const heroSource = readFileSync(
  resolve(process.cwd(), "components/landing/hero.tsx"),
  "utf8",
);
const cockpitSource = readFileSync(
  resolve(process.cwd(), "components/landing/cockpit.tsx"),
  "utf8",
);

afterEach(cleanup);

describe("FR-PUB-01 home page", () => {
  it("renders the approved header-to-footer copy", () => {
    const { container } = render(<HomePage />);
    const nav = within(container.querySelector<HTMLElement>("#site-navigation")!);

    expect(nav.getByRole("link", { name: "eQOURSE+" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Solutions" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Experts" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Vendors" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Access eQOURSE+" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Join the expert network powering AI and world-class content.",
    );
    expect(screen.getByRole("heading", { name: 'The Antidote to the "Black-Box" Industry' })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frequently Asked Questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ready to Power the Next Frontier of AI and Content?" })).toBeInTheDocument();
    expect(screen.getByText("PLATFORM")).toBeInTheDocument();
    expect(screen.getByText(/Transparent project delivery/)).toBeInTheDocument();
  });

  it("keeps the approved hero sentence and cockpit display address", () => {
    expect(heroSource).toContain(
      "Whether you are a specialist, an agency or an enterprise, eQOURSE+ delivers operational clarity.",
    );
    expect(cockpitSource).toContain(
      "plus.eqourse.com/cockpit/telemetry-live",
    );
    expect(cockpitSource).not.toContain("telementry-live");
  });

  it("loads the display and editorial serif typefaces used by the design system", () => {
    expect(layoutSource).toMatch(/Inter_Tight\(/);
    expect(layoutSource).toMatch(/Instrument_Serif\(/);
    expect(landingStyles).toMatch(/\.lx-display\s*\{[^}]*var\(--font-display\)/);
    expect(landingStyles).toMatch(/\.lx-serif\s*\{[^}]*var\(--font-serif\)/);
  });

  it("renders one h1 with an unbroken heading hierarchy", () => {
    const { container } = render(<HomePage />);
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6"),
    );

    expect(headings.filter((heading) => heading.tagName === "H1")).toHaveLength(1);
    for (let index = 1; index < headings.length; index += 1) {
      const previousLevel = Number(headings[index - 1]?.tagName.slice(1));
      const currentLevel = Number(headings[index]?.tagName.slice(1));
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
    }
  });

  it("renders the Figma landing-page regions in the required order", () => {
    const { container } = render(<HomePage />);
    const regions = Array.from(
      container.querySelectorAll<HTMLElement>("[data-home-region]"),
    );

    expect(regions.map((region) => region.id)).toEqual([
      "site-navigation",
      "hero",
      "categories",
      "how-it-works",
      "glass-box",
      "trust",
      "faq",
      "final-cta",
      "site-footer",
    ]);
    for (const region of regions) {
      const labelledBy = region.getAttribute("aria-labelledby");
      expect(labelledBy, `${region.id} aria-labelledby`).toBeTruthy();
      expect(container.querySelector(`#${labelledBy}`)).not.toBeNull();
    }
  });

  it("limits digit-bearing visible claims to the approved facts", () => {
    const { container } = render(<HomePage />);
    container.querySelectorAll("script").forEach((script) => script.remove());
    const digitClaims = container.textContent?.match(/\d[\d+]*/g) ?? [];
    expect(digitClaims).toContain("30+");
    expect(digitClaims).toContain("20+");
    expect(container).not.toHaveTextContent(/Active Specialists.*47|Deliverables YTD.*12\.4K|Golden Match.*99\.2|SLA Compliance.*100/);
    expect(container).not.toHaveTextContent(/Dr\. Aris Vatsal|Stanford NLP Fellow|REAL SPECIALISTS, REAL RESULTS/);
  });

  it("contains the required eQOURSE footer relationship", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/eQOURSE\+ is an enterprise division/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /visit eQOURSE/i }),
    ).toHaveAttribute("href", "https://www.eqourse.com/");
  });

  it("uses only crawlable in-page or external links", () => {
    const { container } = render(<HomePage />);

    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href") ?? "";
      expect(
        link.hash.length > 1 ||
          href === "/jobs" ||
          RESOLVING_ROUTES.some((route) => href === route) ||
          EXCLUDED_ROUTES.some((route) => href === route) ||
          link.href.startsWith("https://www.eqourse.com/"),
        href,
      ).toBe(true);
    }

    expect(primaryNavHrefs(container)).toEqual(PRIMARY_NAV_HREFS);
  });

  it("links to both public talent models from the primary navigation", () => {
    const { container } = render(<HomePage />);
    const nav = within(container.querySelector<HTMLElement>("#site-navigation")!);

    expect(nav.getByRole("link", { name: "Experts" })).toHaveAttribute(
      "href",
      "/freelancers",
    );
    expect(nav.getByRole("link", { name: "Vendors" })).toHaveAttribute(
      "href",
      "/vendors",
    );
    expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("marks every decorative svg as hidden and every image with alt text", () => {
    const { container } = render(<HomePage />);

    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
    for (const image of container.querySelectorAll("img")) {
      expect(image).toHaveAttribute("alt");
    }
  });

  it("keeps static page and section components on the server", () => {
    expect(pageSource).not.toMatch(/["']use client["']/);
  });

  it("numbers every specialization track", () => {
    const { container } = render(<HomePage />);
    const numbers = Array.from(
      container.querySelectorAll("#how-it-works .lx-node__num"),
      (node) => node.textContent,
    );
    expect(numbers).toEqual(["01", "02", "03", "04", "05", "06", "07", "08"]);
  });

  it("enforces 48px buttons and links in the shared chrome", () => {
    expect(landingStyles).toMatch(/\.lx-btn\s*\{[^}]*min-height:\s*3rem/);
    expect(landingStyles).toMatch(/\.lx-link\s*\{[^}]*min-height:\s*2\.75rem/);
  });

  it("offers the same three segment CTAs in the hero, pillars and final call to action", () => {
    const { container } = render(<HomePage />);
    for (const region of ["#hero", "#categories", "#final-cta"]) {
      const scope = within(container.querySelector<HTMLElement>(region)!);
      for (const item of SEGMENTS) {
        expect(
          scope.getByRole("link", { name: new RegExp(item.cta) }),
          `${region} ${item.cta}`,
        ).toHaveAttribute("href", item.href);
      }
    }
    expect(landingStyles).toMatch(/\.lx-btn--primary\s*\{[^}]*color:\s*hsl\(var\(--lx-on-emerald\)\)/);
    expect(landingStyles).toMatch(/\.lx-btn:active\s*\{[^}]*--lx-press:\s*0\.96/);
  });

  it("uses the confirmed Singapore and ISO wording without verification markers", () => {
    render(<HomePage />);

    expect(screen.getByText(/Singapore & India · ISO 9001 and ISO\/IEC 27001 certified/)).toBeInTheDocument();
    expect(screen.getByText("ISO 9001:2015 Certified")).toBeInTheDocument();
    expect(screen.getByText("ISO/IEC 27001 Certified")).toBeInTheDocument();
    expect(screen.queryByText(/⚠ VERIFY/)).not.toBeInTheDocument();
  });

  it("renders the hero segment dock and navigation as liquid glass", () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector("#site-navigation")).toHaveClass("lx-glass");
    expect(container.querySelector(".lx-hero__dock")).toHaveAttribute("data-lens");
    expect(container.querySelector(".cockpit")).not.toBeNull();
    expect(heroSource).toContain("LiquidLens");
  });

  it.each(["light", "dark"] as const)(
    "keeps %s page text AA over the ambient composite",
    (theme) => {
      const tokens = themeDeclarations(theme);
      const surface = worstAmbientSurface(tokens, "background");
      const foreground = hslToRgb(
        parseHsl(resolveToken(tokens, "foreground")),
      );
      const muted = hslToRgb(
        parseHsl(resolveToken(tokens, "muted-foreground")),
      );

      expect(contrastRgb(foreground, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRgb(muted, surface)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
