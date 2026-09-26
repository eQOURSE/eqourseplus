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
} from "../../../../packages/ui/test/contrast-helpers";
import { freelancerFaq } from "./freelancers-data";
import FreelancersPage from "./page";

const pageSource = readFileSync(
  resolve(process.cwd(), "app/freelancers/page.tsx"),
  "utf8",
);
const globalStyles = readFileSync(
  resolve(process.cwd(), "app/globals.css"),
  "utf8",
);
const pageStyles = readFileSync(
  resolve(process.cwd(), "app/freelancers/freelancers-page.module.css"),
  "utf8",
);

function cssRule(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

afterEach(cleanup);

describe("FR-PUB-03 freelancers page", () => {
  it("renders one h1 with an unbroken heading hierarchy", () => {
    const { container } = render(<FreelancersPage />);
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

  it("follows normative F1 with profile before verification", () => {
    const journey = screenAfterRender().getAllByTestId("journey-step");

    expect(journey.map((step) => step.querySelector("h3")?.textContent)).toEqual([
      "Register",
      "Build profile",
      "Verify",
      "Prove your skills",
      "Badge and tier",
      "Get matched",
      "Deliver",
      "Get paid",
    ]);
  });

  it("is honest about availability and uses only in-page calls to action", () => {
    const { container } = render(<FreelancersPage />);

    expect(
      screen.getByRole("heading", { name: "Can I create an account today?" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Create account/ })).toHaveLength(2);
    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href") ?? "";
      const isChromeLink =
        href === "/" ||
        href === "/freelancers" ||
        href === "/jobs" ||
        href === "/vendors" ||
        href === "/clients" ||
        href === "/about" ||
        href === "/login" ||
        href === "/register" ||
        href === "/register/freelancer" ||
        href === "https://www.eqourse.com/";
      expect(href.startsWith("#") || isChromeLink, href).toBe(true);
    }

    expect(
      Array.from(
        container.querySelectorAll<HTMLAnchorElement>(
          "#site-navigation .home-nav-links a",
        ),
        (link) => link.getAttribute("href"),
      ),
    ).toEqual(["#how-it-works", "#categories", "/freelancers", "/vendors", "/about"]);
  });

  it("uses the HomeChrome shell and renders the visual design sections", () => {
    const { container } = render(<FreelancersPage />);

    expect(screen.getByRole("contentinfo")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Start your verified profile." })).toBeVisible();
    expect(screen.getAllByTestId("journey-step")).toHaveLength(8);
    expect(container.querySelectorAll(".freelancer-proof-card")).toHaveLength(4);
    expect(container.querySelector(".freelancer-ledger")).toBeInTheDocument();
  });

  it("uses one FAQ source for visible disclosures and matching schema", () => {
    const { container } = render(<FreelancersPage />);
    const details = Array.from(container.querySelectorAll("details"));
    const scripts = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
    ).map((script) => JSON.parse(script.textContent ?? ""));
    const faqSchema = scripts.find((block) => block["@type"] === "FAQPage");

    expect(details).toHaveLength(freelancerFaq.length);
    expect(
      details.map((detail) => ({
        question: detail.querySelector("summary h3")?.textContent,
        answer: detail.querySelector("[data-faq-answer]")?.textContent,
      })),
    ).toEqual(
      freelancerFaq.map((item) => ({
        question: item.question,
        answer: item.answer,
      })),
    );
    expect(
      faqSchema.mainEntity.map(
        (entity: {
          name: string;
          acceptedAnswer: { text: string };
        }) => ({
          question: entity.name,
          answer: entity.acceptedAnswer.text,
        }),
      ),
    ).toEqual(
      freelancerFaq.map((item) => ({
        question: item.question,
        answer: item.answer,
      })),
    );
  });

  it("emits exactly FAQPage and BreadcrumbList JSON-LD blocks", () => {
    const { container } = render(<FreelancersPage />);
    const blocks = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
    ).map((script) => JSON.parse(script.textContent ?? ""));

    expect(blocks.map((block) => block["@type"])).toEqual([
      "FAQPage",
      "BreadcrumbList",
    ]);
  });

  it("contains no unsupported numbers, earnings claims, or payout providers", () => {
    const { container } = render(<FreelancersPage />);
    container.querySelectorAll("script").forEach((script) => script.remove());

    const intentionalStepNumbers = container.textContent?.replace(/[1-8](?=verification|testing|matching|delivery)/gi, "") ?? "";
    expect(intentionalStepNumbers.match(/\d[\d+]*/g) ?? []).toEqual([]);
    expect(container.textContent).not.toMatch(
      /₹|\$|€|£|\b(?:Razorpay|Cashfree|Stripe|PayPal)\b|\bearn up to\b|\bper (?:hour|task|month)\b/i,
    );
  });

  it("keeps the page and non-interactive sections on the server with zero focal glass", () => {
    expect(pageSource).not.toMatch(/["']use client["']/);
    expect(pageSource).not.toMatch(/<Glass(?:\s|>)/);
    expect(pageSource).not.toContain("tier=\"focal\"");
  });

  it("uses the shared light and dark surface tokens throughout the page", () => {
    expect(pageStyles).toMatch(/\.page\s*\{[\s\S]*background:\s*hsl\(var\(--background\)\)/);
    expect(pageStyles).toMatch(/background:\s*var\(--glass-regular\)/);
    expect(pageStyles).toMatch(/background:\s*var\(--glass-clear\)/);
    expect(pageStyles).not.toMatch(/background:\s*(?:white|#f4fbf8|#fff)\s*;/i);
    expect(pageStyles).not.toMatch(/color:\s*white\s*;/i);
  });

  it("gives every FAQ summary a 48px target, visible marker, spacing, and focus ring", () => {
    const rule = cssRule(globalStyles, ".freelancer-faq summary");
    const focusRule = cssRule(
      globalStyles,
      ".freelancer-faq summary:focus-visible",
    );

    expect(rule).toMatch(/min-height:\s*3rem/);
    expect(rule).toMatch(/padding:/);
    expect(rule).not.toMatch(/list-style:\s*none/);
    expect(focusRule).toMatch(
      /outline:\s*2px solid hsl\(var\(--ring\) \/ 0\.6\)/,
    );
    expect(focusRule).toMatch(/outline-offset:/);
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

function screenAfterRender() {
  render(<FreelancersPage />);
  return screen;
}
