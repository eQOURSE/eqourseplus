import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentType } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FreelancerRegistrationPage, {
  metadata as freelancerMetadata,
} from "./freelancer/page";
import ClientRegistrationPage, {
  metadata as clientMetadata,
} from "./client/page";
import RegisterPage, { metadata as registerMetadata } from "./page";
import {
  FREELANCER_REGISTER_DESCRIPTION,
  FREELANCER_REGISTER_TITLE,
  CLIENT_REGISTER_DESCRIPTION,
  CLIENT_REGISTER_TITLE,
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
  "/jobs",
  "/vendors",
  "/about",
  "/login",
  "/register",
  "/register/freelancer",
  "/register/vendor",
  "/register/client",
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
    name: "client registration",
    route: "/register/client",
    Page: ClientRegistrationPage,
    metadata: clientMetadata,
    title: CLIENT_REGISTER_TITLE,
    titleLength: 30,
    description: CLIENT_REGISTER_DESCRIPTION,
    descriptionLength: 107,
    source: readFileSync(
      resolve(process.cwd(), "app/register/client/page.tsx"),
      "utf8",
    ),
  },
  {
    name: "register",
    route: "/register",
    Page: RegisterPage,
    metadata: registerMetadata,
    title: REGISTER_TITLE,
    titleLength: 22,
    description: REGISTER_DESCRIPTION,
    descriptionLength: 100,
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
    descriptionLength: 120,
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
    descriptionLength: 112,
    source: readFileSync(
      resolve(process.cwd(), "app/register/vendor/page.tsx"),
      "utf8",
    ),
  },
];

afterEach(cleanup);

describe("FR-PUB-06 registration routes", () => {
  it("keeps a responsive gap between the navigation and vendor registration form", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "app/globals.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /\.company-onboarding-page\s*\{[^}]*margin-top:\s*clamp\(1\.5rem, 4vw, 3rem\)/s,
    );
  });

  it("adapts the company onboarding controls below nine hundred pixels", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "app/globals.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /@media \(max-width: 56\.25rem\)[\s\S]*?\.company-onboarding-stepper ol\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 47\.999rem\)[\s\S]*?\.company-onboarding-actions,[\s\S]*?\.company-onboarding-review-actions\s*\{[^}]*grid-template-columns:\s*1fr/,
    );
  });

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
      "Register with eQOURSE+",
    );
    expect(REGISTER_DESCRIPTION).toBe(
      "Choose the freelancer, vendor or client registration path that fits how you will work with eQOURSE+.",
    );
    expect(FREELANCER_REGISTER_TITLE).toBe(
      "Freelancer Registration | eQOURSE+",
    );
    expect(FREELANCER_REGISTER_DESCRIPTION).toBe(
      "Create your eQOURSE+ freelancer account with country selection and verification for your email address and phone number.",
    );
    expect(VENDOR_REGISTER_TITLE).toBe("Vendor Registration | eQOURSE+");
    expect(VENDOR_REGISTER_DESCRIPTION).toBe(
      "Register your company with eQOURSE+ using country-specific details, identifiers, documents and bank information.",
    );
    expect(CLIENT_REGISTER_TITLE).toBe("Client Registration | eQOURSE+");
    expect(CLIENT_REGISTER_DESCRIPTION).toBe(
      "Register your company with eQOURSE+ using country-specific identifiers, documents and an authorised person.",
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
    ({ name, Page }) => {
      const { container } = render(<Page />);
      const visibleText = container.textContent ?? "";

      if (name === "register") {
        expect(visibleText.match(/\d[\d+]*/g) ?? []).toEqual([]);
      }
      expect(visibleText).not.toMatch(/\b(?:wizard|placeholder|preview)\b/i);
      expect(visibleText).not.toMatch(
        /\u20b9|\u0024|\u20ac|\u00a3|\b(?:Razorpay|Cashfree|Stripe|PayPal|DocuSign|Dropbox Sign|Digio|Leegality|IDfy|HyperVerge|Sumsub|Onfido|Persona|Veriff)\b|\b(?:commission|take[- ]?rate|margin|fee percentage|settlement|turnaround|SLA|headcount|capacity)\b|\bearn\b|\bper (?:hour|task)\b/i,
      );
      const allowedIdentifiers =
        name === "freelancer registration" ? ["PAN"] : [];
      const identifiers =
        visibleText.match(
          /\b(?:PAN|GSTIN|UEN|CIN|LLPIN)\b|\b(?:tax|company) registration number\b/gi,
        ) ?? [];
      expect(
        identifiers.filter(
          (identifier) => !allowedIdentifiers.includes(identifier),
        ),
      ).toEqual([]);
      expect(visibleText).not.toMatch(
        /\b\d{1,5}\s+(?:[A-Z][\w.-]*\s+){0,4}(?:Street|Road|Avenue|Lane|Drive|Boulevard)\b/i,
      );
    },
  );

  it.each(routeCases)(
    "permits only approved links and keeps public navigation unchanged for $name",
    ({ name, Page }) => {
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
        ).toEqual(
          name === "freelancer registration"
            ? ["#how-it-works", "#categories", "/freelancers", "/vendors", "/about"]
            : ["/", "/freelancers", "/vendors", "/about"],
        );
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
    expect(
      screen.getByRole("link", { name: "Continue as a client" }),
    ).toHaveAttribute("href", "/register/client");
  });

  it("links existing account holders to login in one action", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("link", { name: "Log in" }),
    ).toHaveAttribute("href", "/login");
  });

  it(
    "keeps the vendor route server-rendered with a session-aware company onboarding entry",
    () => {
      expect(VendorRegistrationPage).toBeTypeOf("function");
      expect(
        readFileSync(
          resolve(process.cwd(), "app/register/vendor/page.tsx"),
          "utf8",
        ),
      ).toContain("<CompanyOnboardingEntry actor=\"vendor\" />");
    },
  );

  it("keeps the client route server-rendered with the client onboarding actor", () => {
    expect(ClientRegistrationPage).toBeTypeOf("function");
    expect(
      readFileSync(
        resolve(process.cwd(), "app/register/client/page.tsx"),
        "utf8",
      ),
    ).toContain("<CompanyOnboardingEntry actor=\"client\" />");
  });

  it("keeps the freelancer route server-only while rendering a client form island", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/register/freelancer/page.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/["']use client["']/);
    expect(source).not.toContain("fetch(");
    expect(source).not.toMatch(/action\s*=/);
    expect(source).toContain("<FreelancerRegistrationForm />");
  });

  it.each([
    ["freelancer", FreelancerRegistrationPage],
    ["vendor", VendorRegistrationPage],
    ["client", ClientRegistrationPage],
  ] as const)("links the %s path back to the role choice", (_, Page) => {
    render(<Page />);

    expect(
      screen.getByRole("link", { name: "Back to role choice" }),
    ).toHaveAttribute("href", "/register");
  });
});
