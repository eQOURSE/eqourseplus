import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LOGIN_DESCRIPTION, LOGIN_TITLE } from "./login-data";
import LoginPage, { metadata } from "./page";

const pageSource = readFileSync(
  resolve(process.cwd(), "app/login/page.tsx"),
  "utf8",
);

const APPROVED_LINKS = [
  "/",
  "/freelancers",
  "/jobs",
  "/vendors",
  "/about",
  "/login",
  "/register",
  "/register/freelancer",
  "/register/vendor",
  "https://www.eqourse.com/",
] as const;

afterEach(cleanup);

describe("FR-PUB-06 login page", () => {
  it("exports exact noindex metadata within SEO length limits", () => {
    expect(LOGIN_TITLE).toBe("Log in | eQOURSE+");
    expect(LOGIN_TITLE).toHaveLength(17);
    expect(LOGIN_DESCRIPTION).toBe(
      "Sign-in to eQOURSE+ is not open yet. It opens when registration opens.",
    );
    expect(LOGIN_DESCRIPTION).toHaveLength(70);
    expect(metadata).toEqual({
      title: LOGIN_TITLE,
      description: LOGIN_DESCRIPTION,
      alternates: { canonical: "/login" },
      robots: { index: false, follow: true },
    });
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });

  it("renders zero structured-data scripts", () => {
    const { container } = render(<LoginPage />);

    expect(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(0);
  });

  it("contains zero digits, internal jargon, and unsupported claims", () => {
    const { container } = render(<LoginPage />);
    const visibleText = container.textContent ?? "";

    expect(visibleText.match(/\d[\d+]*/g) ?? []).toEqual([]);
    expect(visibleText).not.toMatch(/\b(?:wizard|placeholder|preview)\b/i);
    expect(visibleText).not.toMatch(
      /\u20b9|\u0024|\u20ac|\u00a3|\b(?:Razorpay|Cashfree|Stripe|PayPal|DocuSign|Dropbox Sign|Digio|Leegality|IDfy|HyperVerge|Sumsub|Onfido|Persona|Veriff)\b|\b(?:commission|take[- ]?rate|margin|fee percentage|settlement|turnaround|SLA|headcount|capacity)\b|\bearn\b|\bper (?:hour|task)\b/i,
    );
    expect(visibleText).not.toMatch(
      /\b(?:PAN|GSTIN|UEN|CIN|LLPIN)\b|\b(?:tax|company) registration number\b/i,
    );
    expect(visibleText).not.toMatch(
      /\b\d{1,5}\s+(?:[A-Z][\w.-]*\s+){0,4}(?:Street|Road|Avenue|Lane|Drive|Boulevard)\b/i,
    );
  });

  it("permits only approved links and keeps the public navigation unchanged", () => {
    const { container } = render(<LoginPage />);

    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href") ?? "";
      expect(
        href.startsWith("#") || APPROVED_LINKS.includes(href as never),
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
    ).toEqual(["/", "/freelancers", "/vendors", "/about"]);
    expect(
      container.querySelector("#site-navigation [aria-current]"),
    ).toBeNull();
  });

  it("stays server-only with zero focal glass and no auth wiring", () => {
    expect(pageSource).not.toMatch(/["']use client["']/);
    expect(pageSource).not.toMatch(/<Glass(?:\s|>)/);
    expect(pageSource).not.toContain('tier="focal"');
    expect(pageSource).not.toContain("fetch(");
    expect(pageSource).not.toMatch(/action\s*=/);
    expect(pageSource).not.toMatch(/from\s+["'][^"']*apps\/api/);
  });

  it("renders one h1, labelled sections, and an unbroken heading hierarchy", () => {
    const { container } = render(<LoginPage />);
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

  it("states sign-in availability honestly and links to registration", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(
        "Sign-in is not open yet. It opens when registration opens.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to registration" }),
    ).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});
