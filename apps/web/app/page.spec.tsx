import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  contrastRgb,
  hslToRgb,
  parseHsl,
  resolveToken,
  themeDeclarations,
  worstAmbientSurface,
} from "../../../packages/ui/test/contrast-helpers";
import HomePage from "./page";
import { EXCLUDED_ROUTES, RESOLVING_ROUTES } from "./public-routes";

const pageSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const globalStyles = readFileSync(
  resolve(process.cwd(), "app/globals.css"),
  "utf8",
);
const uiStyles = readFileSync(
  resolve(process.cwd(), "../../packages/ui/src/styles.css"),
  "utf8",
);
const homeStyles = readFileSync(
  resolve(process.cwd(), "components/home/home-redesign.module.css"),
  "utf8",
);
const heroSource = readFileSync(
  resolve(process.cwd(), "components/home/HeroSection.tsx"),
  "utf8",
);

function cssRule(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

afterEach(cleanup);

describe("FR-PUB-01 home page", () => {
  it("matches the selected Figma frame's visible header-to-footer copy", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "eQOURSE+" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solutions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Experts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vendors" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Access eQOURSE+" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Join the expert network powering AI and world-class content.",
    );
    expect(screen.getByText('The Antidote to the "Black-Box" Industry')).toBeInTheDocument();
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    expect(screen.getByText("Ready to Power the Next Frontier of AI and Content?")).toBeInTheDocument();
    expect(screen.getByText("PLATFORM")).toBeInTheDocument();
    expect(screen.getByText(/Transparent project delivery/)).toBeInTheDocument();
  });

  it("uses the exact Figma typography, palette, frame width and section geometry", () => {
    expect(homeStyles).toMatch(/--figma-ink:\s*#18181b/);
    expect(homeStyles).toMatch(/--figma-teal:\s*#0f766e/);
    expect(homeStyles).toMatch(/--figma-blue:\s*#0284c7/);
    expect(homeStyles).toMatch(/--figma-border:\s*#e4e4e7/);
    expect(homeStyles).toMatch(/font-family:\s*var\(--font-plus-jakarta-sans\)/);
    expect(homeStyles).toMatch(/max-width:\s*1280px/);
    expect(homeStyles).toMatch(/min-height:\s*1329px/);
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
    expect(digitClaims).not.toContain("30+");
    expect(digitClaims).not.toContain("20+");
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

    expect(
      Array.from(
        container.querySelectorAll<HTMLAnchorElement>(
          "#site-navigation .home-nav-links a",
        ),
        (link) => link.getAttribute("href"),
      ),
    ).toEqual([
      "#how-it-works",
      "#categories",
      "/freelancers",
      "/vendors",
      "/about",
    ]);
  });

  it("contextually links to both public talent models", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "More for freelancers →" }),
    ).toHaveAttribute("href", "/freelancers");
    expect(
      screen.getByRole("link", { name: "More for vendors →" }),
    ).toHaveAttribute("href", "/vendors");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
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

  it("numbers workflow steps through CSS counters", () => {
    expect(globalStyles).toMatch(/\.home-steps\s*\{[^}]*counter-reset:\s*step/s);
    expect(globalStyles).toMatch(
      /\.home-step::before\s*\{[^}]*content:\s*counter\(step\)/s,
    );
  });

  it("enforces 48px nav, footer, category, CTA and theme-toggle targets", () => {
    for (const selector of [
      ".home-nav-link",
      ".home-footer-link",
      ".home-category-link",
      ".home-cta",
      ".home-shell .eq-theme-toggle__track",
    ]) {
      expect(cssRule(globalStyles, selector), selector).toMatch(
        /min-height:\s*3rem/,
      );
    }
    expect(cssRule(globalStyles, ".home-nav-link")).toMatch(/padding-inline:/);
    expect(cssRule(globalStyles, ".home-footer-link")).toMatch(/padding-inline:/);
  });

  it("gives CTA anchors the deep plate, gel press, and focus contract", () => {
    render(<HomePage />);
    const primaryCta = screen.getByRole("link", {
      name: "Apply as an Expert (Work Remotely)",
    });

    expect(primaryCta).toHaveClass(
      "eq-glass-button",
      "eq-glass-button--primary",
      "home-cta",
    );
    expect(uiStyles).toContain(
      "--glass-plate-primary: linear-gradient(135deg, hsl(170 82% 26%), hsl(174 72% 20%));",
    );
    expect(cssRule(uiStyles, ".eq-glass-button")).toContain(
      "var(--ease-gel-press)",
    );
    expect(cssRule(uiStyles, ".eq-glass-button--primary:active")).toContain(
      "scale(0.96, 0.94)",
    );
    expect(cssRule(uiStyles, ".eq-glass-button--primary:focus-visible")).toMatch(
      /outline:\s*2px solid hsl\(var\(--ring\) \/ 0\.6\)/,
    );
  });

  it("uses the confirmed Singapore and ISO wording without verification markers", () => {
    render(<HomePage />);

    expect(screen.getByText(/Singapore & India · ISO 9001 and ISO\/IEC 27001 certified/)).toBeInTheDocument();
    expect(screen.getByText("ISO 9001:2015")).toBeInTheDocument();
    expect(screen.getByText("ISO/IEC 27001")).toBeInTheDocument();
    expect(screen.queryByText(/⚠ VERIFY/)).not.toBeInTheDocument();
  });

  it("uses the predefined UI glass substrate and button primitives", () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector(".eq-glass-stage > .eq-glass-substrate")).not.toBeNull();
    expect(container.querySelectorAll(".eq-glass-button").length).toBeGreaterThanOrEqual(7);
    expect(container.querySelector(".cockpit")).toHaveClass("eq-glass-stage");
    expect(heroSource).toContain("eq-glass-substrate");
    expect(heroSource).not.toContain("LiquidGlassHomeEffect");
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
