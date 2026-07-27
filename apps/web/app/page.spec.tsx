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
import { testimonials } from "../content/testimonials";
import { Testimonials } from "../components/home/testimonials";
import HomePage from "./page";

const pageSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const testimonialSource = readFileSync(
  resolve(process.cwd(), "components/home/testimonials.tsx"),
  "utf8",
);
const globalStyles = readFileSync(
  resolve(process.cwd(), "app/globals.css"),
  "utf8",
);
const uiStyles = readFileSync(
  resolve(process.cwd(), "../../packages/ui/src/styles.css"),
  "utf8",
);

function cssRule(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

afterEach(cleanup);

describe("FR-PUB-01 home page", () => {
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

  it("renders the seven named regions in the required order", () => {
    const { container } = render(<HomePage />);
    const regions = Array.from(
      container.querySelectorAll<HTMLElement>("[data-home-region]"),
    );

    expect(regions.map((region) => region.id)).toEqual([
      "site-navigation",
      "hero",
      "trust",
      "how-it-works",
      "categories",
      "stats",
      "site-footer",
    ]);
    for (const region of regions) {
      const labelledBy = region.getAttribute("aria-labelledby");
      expect(labelledBy, `${region.id} aria-labelledby`).toBeTruthy();
      expect(container.querySelector(`#${labelledBy}`)).not.toBeNull();
    }
  });

  it("ships no testimonials but supports supplied verified content", () => {
    expect(testimonials).toEqual([]);
    const { container, rerender } = render(<Testimonials items={testimonials} />);
    expect(container).toBeEmptyDOMElement();

    rerender(
      <Testimonials
        items={[
          {
            attribution: "Supplied attribution",
            quote: "Supplied verified quote.",
          },
        ]}
      />,
    );
    expect(screen.getByText("Supplied verified quote.")).toBeInTheDocument();
    expect(screen.getByText("Supplied attribution")).toBeInTheDocument();
  });

  it("limits digit-bearing visible claims to the approved facts", () => {
    const { container } = render(<HomePage />);
    container.querySelectorAll("script").forEach((script) => script.remove());
    const digitClaims = container.textContent?.match(/\d[\d+]*/g) ?? [];

    expect(new Set(digitClaims)).toEqual(
      new Set(["500+", "30+", "9001", "27001"]),
    );
  });

  it("contains the required eQOURSE footer relationship", () => {
    render(<HomePage />);

    expect(
      screen.getByText("eQOURSE+ — the talent platform by eQOURSE"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /visit eQOURSE/i }),
    ).toHaveAttribute("href", "https://eqourse.com");
  });

  it("uses only crawlable in-page or external links", () => {
    const { container } = render(<HomePage />);

    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      expect(
        link.hash.length > 1 || link.href.startsWith("https://eqourse.com"),
        link.getAttribute("href") ?? "",
      ).toBe(true);
    }
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
    expect(testimonialSource).not.toMatch(/["']use client["']/);
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
    const primaryCta = screen.getByRole("link", { name: "Explore services" });

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
