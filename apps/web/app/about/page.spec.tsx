import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { structuredData as homeStructuredData } from "../home-data";
import { aboutStructuredData } from "./about-data";
import AboutPage from "./page";

const pageSource = readFileSync(
  resolve(process.cwd(), "app/about/page.tsx"),
  "utf8",
);

afterEach(cleanup);

function expectSharedValuesMatch(
  homeValue: unknown,
  aboutValue: unknown,
  path = "organization",
): void {
  if (
    homeValue !== null &&
    aboutValue !== null &&
    typeof homeValue === "object" &&
    typeof aboutValue === "object" &&
    !Array.isArray(homeValue) &&
    !Array.isArray(aboutValue)
  ) {
    const homeRecord = homeValue as Record<string, unknown>;
    const aboutRecord = aboutValue as Record<string, unknown>;

    for (const key of Object.keys(homeRecord)) {
      if (key in aboutRecord) {
        expectSharedValuesMatch(
          homeRecord[key],
          aboutRecord[key],
          `${path}.${key}`,
        );
      }
    }
    return;
  }

  expect(aboutValue, path).toEqual(homeValue);
}

describe("FR-PUB-05 about page", () => {
  it("renders one h1, labelled sections, and an unbroken heading hierarchy", () => {
    const { container } = render(<AboutPage />);
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

  it("presents only the approved parent, service, reach, and certification facts", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "The talent platform by eQOURSE." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "eQOURSE provides AI Data Services and Content Services, while TUTRAIN provides Tutoring. Operations span India and Singapore.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("500+ specialists")).toBeInTheDocument();
    expect(screen.getByText("30+ languages")).toBeInTheDocument();
    expect(screen.getByText("ISO 9001")).toBeInTheDocument();
    expect(screen.getByText("ISO 27001")).toBeInTheDocument();
  });

  it("describes only the implemented security controls", () => {
    render(<AboutPage />);

    expect(
      screen.getByText(
        "Access is role-based, and authentication endpoints are rate-limited.",
      ),
    ).toBeInTheDocument();
  });

  it("uses the approved parent-site contact route and permits only approved links", () => {
    const { container } = render(<AboutPage />);

    expect(
      screen.getByRole("link", { name: "Contact eQOURSE" }),
    ).toHaveAttribute("href", "https://www.eqourse.com/contact-us");

    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href") ?? "";
      expect(
        href.startsWith("#") ||
          [
            "/",
            "/freelancers",
            "/vendors",
            "/about",
            "https://www.eqourse.com/",
            "https://www.eqourse.com/contact-us",
          ].includes(href),
        href,
      ).toBe(true);
    }
  });

  it("uses the exact approved set of visible digit-bearing claims", () => {
    const { container } = render(<AboutPage />);
    container.querySelectorAll("script").forEach((script) => script.remove());
    const digitClaims = container.textContent?.match(/\d[\d+]*/g) ?? [];

    expect(new Set(digitClaims)).toEqual(
      new Set(["500+", "30+", "9001", "27001"]),
    );
  });

  it("excludes registration identifiers, street addresses, and unsupported trust claims", () => {
    const { container } = render(<AboutPage />);
    container.querySelectorAll("script").forEach((script) => script.remove());
    const visibleText = container.textContent ?? "";

    expect(visibleText).not.toMatch(
      /\b(?:PAN|GSTIN|UEN|CIN|LLPIN)\b|\b(?:tax|company) registration number\b/i,
    );
    expect(visibleText).not.toMatch(
      /\b\d{1,5}\s+(?:[A-Z][\w.-]*\s+){0,4}(?:Street|Road|Avenue|Lane|Drive|Boulevard)\b/i,
    );
    expect(visibleText).not.toMatch(
      /\b(?:SOC 2|penetration test|bug bounty|AES|uptime|availability|data residency|breach notification|certificate number|issuing body|audit date|founding date|client name|testimonial|settlement timeline)\b/i,
    );
  });

  it("emits the partial Organization and BreadcrumbList nodes in order", () => {
    const { container } = render(<AboutPage />);
    const blocks = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
    ).map((script) => JSON.parse(script.textContent ?? ""));

    expect(blocks).toEqual(aboutStructuredData);
    expect(blocks.map((block) => block["@type"])).toEqual([
      "Organization",
      "BreadcrumbList",
    ]);
    expect(Object.keys(blocks[0] ?? {})).toEqual([
      "@context",
      "@type",
      "@id",
      "parentOrganization",
      "hasCertification",
    ]);
    expect(blocks[0]?.parentOrganization).toEqual({
      "@id": "https://www.eqourse.com/#organization",
    });
    expect(blocks[1]?.itemListElement.map((item: { name: string }) => item.name))
      .toEqual(["Home", "About"]);
  });

  it("keeps every overlapping Organization value identical to home", () => {
    const homeOrganization = homeStructuredData[0];
    const aboutOrganization = aboutStructuredData[0];

    expect(aboutOrganization["@id"]).toBe(homeOrganization["@id"]);
    expectSharedValuesMatch(homeOrganization, aboutOrganization);
  });

  it("keeps the page on the server with zero focal glass", () => {
    expect(pageSource).not.toMatch(/["']use client["']/);
    expect(pageSource).not.toMatch(/<Glass(?:\s|>)/);
    expect(pageSource).not.toContain('tier="focal"');
  });

  it("marks decorative SVGs hidden and the about navigation current", () => {
    const { container } = render(<AboutPage />);

    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
