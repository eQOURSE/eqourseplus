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
import { vendorFaq } from "./vendors-data";
import VendorsPage from "./page";

const pageSource = readFileSync(
  resolve(process.cwd(), "app/vendors/page.tsx"),
  "utf8",
);
const globalStyles = readFileSync(
  resolve(process.cwd(), "app/globals.css"),
  "utf8",
);

function cssRule(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

afterEach(cleanup);

describe("FR-PUB-04 vendors page", () => {
  it("renders one h1, labelled sections, and an unbroken heading hierarchy", () => {
    const { container } = render(<VendorsPage />);
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6"),
    );

    expect(headings.filter((heading) => heading.tagName === "H1")).toHaveLength(1);
    for (let index = 1; index < headings.length; index += 1) {
      const previousLevel = Number(headings[index - 1]?.tagName.slice(1));
      const currentLevel = Number(headings[index]?.tagName.slice(1));
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
    }

    for (const section of container.querySelectorAll("section")) {
      const labelledBy = section.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(container.querySelector(`#${labelledBy}`)).not.toBeNull();
    }
  });

  it("follows F2 through allocation, then its documented delivery and invoice continuation", () => {
    render(<VendorsPage />);
    const journey = screen.getAllByTestId("vendor-step");

    expect(journey.map((step) => step.querySelector("h3")?.textContent)).toEqual([
      "Register the agency",
      "Provide KYB documents",
      "Complete signatory checks",
      "Describe agency capabilities",
      "Complete review and enter active status",
      "Invite vendor members",
      "Respond to a sealed RFP",
      "Move from award to work order",
      "Allocate tasks to members",
      "Deliver through QA",
      "Invoice against milestones",
    ]);
  });

  it("covers the required capability and RFP model without claiming live bidding", () => {
    render(<VendorsPage />);

    expect(screen.getByText("Capability requirements")).toBeInTheDocument();
    for (const heading of [
      "Company evidence",
      "Signatory and ownership checks",
      "Capability profile",
      "Member readiness",
      "Tax profile",
      "Project setup",
      "Vendor-only posting",
      "Sealed responses",
      "Side-by-side review",
      "Award to delivery",
      "Milestone invoicing",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        "Vendor RFPs belong to a later platform phase. This page explains the model; it does not announce live bidding.",
      ),
    ).toBeInTheDocument();
  });

  it("links to the approved case-study source without restating outcomes", () => {
    render(<VendorsPage />);

    expect(
      screen.getByRole("link", { name: "Explore eQOURSE case studies" }),
    ).toHaveAttribute("href", "https://www.eqourse.com/casestudy");
  });

  it("is honest about availability and permits only approved links", () => {
    const { container } = render(<VendorsPage />);

    expect(
      screen.getByRole("heading", { name: "Can my agency register today?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vendor registration is not open yet. eQOURSE+ is being built. This page exists so agencies know what to expect from the verification, member, RFP, and invoicing flows.",
      ),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /\b(sign up|join now|apply|get started|request access|waitlist|partner with us|contact us|submit a bid|become a vendor)\b/i,
    );

    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href") ?? "";
      const isChromeOrSourceLink = [
        "/",
        "/freelancers",
        "/vendors",
        "https://eqourse.com",
        "https://www.eqourse.com/casestudy",
      ].includes(href);
      expect(href.startsWith("#") || isChromeOrSourceLink, href).toBe(true);
    }
  });

  it("uses one FAQ source for visible disclosures and matching schema", () => {
    const { container } = render(<VendorsPage />);
    const details = Array.from(container.querySelectorAll("details"));
    const scripts = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
    ).map((script) => JSON.parse(script.textContent ?? ""));
    const faqSchema = scripts.find((block) => block["@type"] === "FAQPage");

    expect(details).toHaveLength(vendorFaq.length);
    expect(
      details.map((detail) => ({
        question: detail.querySelector("summary h3")?.textContent,
        answer: detail.querySelector("[data-faq-answer]")?.textContent,
      })),
    ).toEqual(
      vendorFaq.map((item) => ({
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
      vendorFaq.map((item) => ({
        question: item.question,
        answer: item.answer,
      })),
    );
  });

  it("emits exactly FAQPage and BreadcrumbList JSON-LD blocks", () => {
    const { container } = render(<VendorsPage />);
    const blocks = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
    ).map((script) => JSON.parse(script.textContent ?? ""));

    expect(blocks.map((block) => block["@type"])).toEqual([
      "FAQPage",
      "BreadcrumbList",
    ]);
    expect(blocks[1]?.itemListElement.map((item: { name: string }) => item.name))
      .toEqual(["Home", "For vendors"]);
  });

  it("contains zero digits and no unsupported vendor claims", () => {
    const { container } = render(<VendorsPage />);
    container.querySelectorAll("script").forEach((script) => script.remove());

    expect(container.textContent?.match(/\d[\d+]*/g) ?? []).toEqual([]);
    expect(container.textContent).not.toMatch(
      /₹|\$|€|£|\b(?:Razorpay|Cashfree|Stripe|PayPal|DocuSign|Dropbox Sign|Digio|Leegality|IDfy|HyperVerge|Sumsub|Onfido|Persona|Veriff)\b|\b(?:commission|take[- ]?rate|margin|fee percentage|settlement|turnaround|SLA|headcount|capacity)\b|\bearn\b|\bper (?:hour|task)\b/i,
    );
    expect(container.textContent).not.toMatch(/\b(?:client|customer) logos?\b/i);
  });

  it("keeps the page on the server with zero focal glass", () => {
    expect(pageSource).not.toMatch(/["']use client["']/);
    expect(pageSource).not.toMatch(/<Glass(?:\s|>)/);
    expect(pageSource).not.toContain("tier=\"focal\"");
  });

  it("marks decorative SVGs hidden and the vendor navigation current", () => {
    const { container } = render(<VendorsPage />);

    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getByRole("link", { name: "For vendors" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("gives every vendor FAQ summary a 48px target, visible marker, spacing, and focus ring", () => {
    const rule = cssRule(globalStyles, ".vendor-faq summary");
    const focusRule = cssRule(globalStyles, ".vendor-faq summary:focus-visible");

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
