import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentType } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FreelancerRegistrationPage, {
  metadata as freelancerMetadata,
} from "./freelancer/page";
import RegisterPage, { metadata as registerMetadata } from "./page";
import {
  FREELANCER_REGISTER_DESCRIPTION,
  FREELANCER_REGISTER_TITLE,
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
  VENDOR_REGISTER_DESCRIPTION,
  VENDOR_REGISTER_TITLE,
} from "./register-data";
import VendorRegistrationPage, {
  metadata as vendorMetadata,
} from "./vendor/page";

const APPROVED_LINKS = [
  "/",
  "/freelancers",
  "/vendors",
  "/about",
  "/login",
  "/register",
  "/register/freelancer",
  "/register/vendor",
  "https://www.eqourse.com/",
] as const;

const routeCases: readonly {
  name: string;
  route: string;
  Page: ComponentType;
  metadata: typeof registerMetadata;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  source: string;
}[] = [
  {
    name: "register",
    route: "/register",
    Page: RegisterPage,
    metadata: registerMetadata,
    title: REGISTER_TITLE,
    titleLength: 45,
    description: REGISTER_DESCRIPTION,
    descriptionLength: 99,
    source: readFileSync(resolve(process.cwd(), "app/register/page.tsx"), "utf8"),
  },
  {
    name: "freelancer registration",
    route: "/register/freelancer",
    Page: FreelancerRegistrationPage,
    metadata: freelancerMetadata,
    title: FREELANCER_REGISTER_TITLE,
    titleLength: 34,
    description: FREELANCER_REGISTER_DESCRIPTION,
    descriptionLength: 118,
    source: readFileSync(
      resolve(process.cwd(), "app/register/freelancer/page.tsx"),
      "utf8",
    ),
  },
  {
    name: "vendor registration",
    route: "/register/vendor",
    Page: VendorRegistrationPage,
    metadata: vendorMetadata,
    title: VENDOR_REGISTER_TITLE,
    titleLength: 30,
    description: VENDOR_REGISTER_DESCRIPTION,
    descriptionLength: 114,
    source: readFileSync(
      resolve(process.cwd(), "app/register/vendor/page.tsx"),
      "utf8",
    ),
  },
];

afterEach(cleanup);

describe("FR-PUB-06 registration routes", () => {
  it.each(routeCases)(
    "exports exact noindex metadata within SEO length limits for $name",
    ({ route, metadata, title, titleLength, description, descriptionLength }) => {
      expect(title).toHaveLength(titleLength);
      expect(description).toHaveLength(descriptionLength);
      expect(metadata).toEqual({
        title,
        description,
        alternates: { canonical: route },
        robots: { index: false, follow: true },
      });
      expect(metadata.openGraph).toBeUndefined();
      expect(metadata.twitter).toBeUndefined();
    },
  );

  it("keeps every registration metadata string exact", () => {
    expect(REGISTER_TITLE).toBe(
      "Register as a freelancer or vendor | eQOURSE+",
    );
    expect(REGISTER_DESCRIPTION).toBe(
      "eQOURSE+ registration is not open yet. The freelancer and vendor paths will open here when it does.",
    );
    expect(FREELANCER_REGISTER_TITLE).toBe(
      "Freelancer Registration | eQOURSE+",
    );
    expect(FREELANCER_REGISTER_DESCRIPTION).toBe(
      "Freelancer registration for eQOURSE+ is not open yet. The country step and the rest of sign-up open with registration.",
    );
    expect(VENDOR_REGISTER_TITLE).toBe("Vendor Registration | eQOURSE+");
    expect(VENDOR_REGISTER_DESCRIPTION).toBe(
      "Vendor registration for eQOURSE+ is not open yet. The country step and the rest of sign-up open with registration.",
    );
  });

  it.each(routeCases)(
    "renders zero structured-data scripts for $name",
    ({ Page }) => {
      const { container } = render(<Page />);

      expect(
        container.querySelectorAll('script[type="application/ld+json"]'),
      ).toHaveLength(0);
    },
  );

  it.each(routeCases)(
    "contains zero digits, internal jargon, and unsupported claims for $name",
    ({ Page }) => {
      const { container } = render(<Page />);
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
    },
  );

  it.each(routeCases)(
    "permits only approved links and keeps public navigation unchanged for $name",
    ({ Page }) => {
      const { container } = render(<Page />);

      for (const link of container.querySelectorAll<HTMLAnchorElement>(
        "a[href]",
      )) {
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
    },
  );

  it.each(routeCases)(
    "stays server-only with zero focal glass and no auth wiring for $name",
    ({ source }) => {
      expect(source).not.toMatch(/["']use client["']/);
      expect(source).not.toMatch(/<Glass(?:\s|>)/);
      expect(source).not.toContain('tier="focal"');
      expect(source).not.toContain("fetch(");
      expect(source).not.toMatch(/action\s*=/);
      expect(source).not.toMatch(/from\s+["'][^"']*apps\/api/);
    },
  );

  it.each(routeCases)(
    "renders one h1, labelled sections, and an unbroken heading hierarchy for $name",
    ({ Page }) => {
      const { container } = render(<Page />);
      const headings = Array.from(
        container.querySelectorAll<HTMLHeadingElement>(
          "h1, h2, h3, h4, h5, h6",
        ),
      );

      expect(
        headings.filter((heading) => heading.tagName === "H1"),
      ).toHaveLength(1);
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
    },
  );

  it("routes each role choice to its matching registration path", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("link", { name: "Continue as a freelancer" }),
    ).toHaveAttribute("href", "/register/freelancer");
    expect(
      screen.getByRole("link", { name: "Continue as a vendor" }),
    ).toHaveAttribute("href", "/register/vendor");
  });

  it.each([
    ["freelancer", FreelancerRegistrationPage],
    ["vendor", VendorRegistrationPage],
  ] as const)(
    "renders an accessible disabled country selector for the %s path",
    (_, Page) => {
      const { container } = render(<Page />);
      const select = screen.getByLabelText("Country");
      const note = screen.getByText("Country selection opens with registration.");

      expect(select).toBeDisabled();
      expect(select).toHaveAttribute("id", "registration-country");
      expect(select).toHaveAttribute(
        "aria-describedby",
        "registration-country-note",
      );
      expect(
        container.querySelector('label[for="registration-country"]'),
      ).not.toBeNull();
      expect(select.querySelectorAll("option")).toHaveLength(1);
      expect(select).toHaveTextContent("Country selection is not available yet");
      expect(note).toHaveAttribute("id", "registration-country-note");
      expect(select.nextElementSibling).toBe(note);
    },
  );

  it.each([
    ["freelancer", FreelancerRegistrationPage],
    ["vendor", VendorRegistrationPage],
  ] as const)("links the %s path back to the role choice", (_, Page) => {
    render(<Page />);

    expect(
      screen.getByRole("link", { name: "Back to role choice" }),
    ).toHaveAttribute("href", "/register");
  });
});
