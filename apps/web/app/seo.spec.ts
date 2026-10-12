import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-plus-jakarta-sans" }),
  JetBrains_Mono: () => ({ variable: "--font-mono" }),
}));

import { metadata as layoutMetadata } from "./layout";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  structuredData,
} from "./home-data";
import { metadata as pageMetadata } from "./page";
import {
  EXCLUDED_ROUTES,
  RESOLVING_ROUTES,
  UNBUILT_ROUTES,
} from "./public-routes";
import robots from "./robots";
import sitemap from "./sitemap";
import HomePage from "./page";

describe("FR-PUB-01 metadata", () => {
  it("keeps the approved title within Section 18 limits and the approved description", () => {
    expect(HOME_TITLE).toBe("eQOURSE+ | Partner for World-Class AI and Content");
    expect(HOME_TITLE.length).toBeGreaterThan(0);
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
    expect(HOME_DESCRIPTION).toBe(
      "Work from anywhere, anytime on frontier AI and global content projects. eQOURSE+ connects verified domain specialists, partner agencies, and leading AI labs in a fully transparent, ISO-certified ecosystem with guaranteed milestone payouts.",
    );
    expect(HOME_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it("declares the contributor, agency and enterprise search-intent keywords", () => {
    expect(pageMetadata.keywords).toEqual(
      expect.arrayContaining([
        "remote AI training jobs",
        "AI data vendor partnership",
        "hire domain experts for AI",
      ]),
    );
  });

  it("sets canonical and language alternates", () => {
    expect(pageMetadata.alternates).toEqual({
      canonical: "/",
      languages: { en: "/", "x-default": "/" },
    });
  });

  it("sets the production metadata base", () => {
    expect(layoutMetadata.metadataBase?.href).toBe("https://plus.eqourse.com/");
  });

  it("uses the approved static brand image as the site icon", () => {
    expect(layoutMetadata.icons).toEqual({
      icon: {
        url: "/favicon.ico",
        type: "image/svg+xml",
      },
    });
  });

  it("provides complete Open Graph and Twitter image metadata", () => {
    expect(pageMetadata.openGraph).toMatchObject({
      type: "website",
      url: "/",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      siteName: "eQOURSE+",
      locale: "en",
    });
    const openGraphImages = Array.isArray(pageMetadata.openGraph?.images)
      ? pageMetadata.openGraph.images
      : [pageMetadata.openGraph?.images];
    expect(openGraphImages).toHaveLength(1);
    expect(openGraphImages[0]).toMatchObject({
      url: "/social-preview.png",
      width: 1200,
      height: 630,
      alt: "eQOURSE+ expert network team",
    });
    expect(pageMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [
        {
          url: "/social-preview.png",
          alt: "eQOURSE+ expert network team",
        },
      ],
    });
  });
});

describe("FR-PUB-01 structured data", () => {
  it("emits exactly Organization and WebSite JSON-LD blocks", () => {
    const { container } = render(createElement(HomePage));
    const blocks = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
    );
    const parsed = blocks.map((block) => JSON.parse(block.textContent ?? ""));

    expect(blocks).toHaveLength(2);
    expect(parsed.map((block) => block["@type"])).toEqual([
      "Organization",
      "WebSite",
    ]);
    expect(parsed).toEqual(structuredData);
  });

  it("identifies the parent organization and verified social profile", () => {
    const organization = structuredData[0];

    expect(organization.parentOrganization?.["@id"]).toBe(
      "https://www.eqourse.com/#organization",
    );
    expect(organization.parentOrganization?.name).toBe("eQOURSE");
    expect(organization.sameAs).toContain("https://twitter.com/EQourse");
    expect(organization).not.toHaveProperty("logo");
  });

  it("excludes unsupported structured-data types and actions", () => {
    const serialized = JSON.stringify(structuredData);

    for (const forbidden of [
      "FAQPage",
      "BreadcrumbList",
      "SearchAction",
      "AggregateRating",
      "Review",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});

describe("FR-PUB-01 crawl controls", () => {
  it("keeps the develop deployment out of search results", () => {
    const previousStaging = process.env.IS_STAGING;
    const previousBranch = process.env.VERCEL_GIT_COMMIT_REF;
    try {
      delete process.env.IS_STAGING;
      process.env.VERCEL_GIT_COMMIT_REF = "develop";
      expect(robots()).toEqual({
        rules: { userAgent: "*", disallow: "/" },
      });

      process.env.VERCEL_GIT_COMMIT_REF = "main";
      process.env.IS_STAGING = "true";
      expect(robots()).toEqual({
        rules: { userAgent: "*", disallow: "/" },
      });
    } finally {
      if (previousStaging === undefined) delete process.env.IS_STAGING;
      else process.env.IS_STAGING = previousStaging;
      if (previousBranch === undefined) delete process.env.VERCEL_GIT_COMMIT_REF;
      else process.env.VERCEL_GIT_COMMIT_REF = previousBranch;
    }
  });

  it("blocks private and noindex routes while declaring host and sitemap", () => {
    const rules = robots();

    expect(rules.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api", "/design-system"],
    });
    expect(rules.sitemap).toBe("https://plus.eqourse.com/sitemap.xml");
    expect(rules.host).toBe("https://plus.eqourse.com");
  });

  it("publishes only resolving routes", () => {
    const entries = sitemap();
    const serialized = JSON.stringify(entries);

    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual(
      RESOLVING_ROUTES,
    );
    for (const route of [...UNBUILT_ROUTES, ...EXCLUDED_ROUTES]) {
      expect(serialized).not.toContain(`plus.eqourse.com${route}`);
    }
  });
});

describe("FR-PUB-01 social image", () => {
  it("uses a LinkedIn-compatible static PNG with the approved dimensions", () => {
    expect(pageMetadata.openGraph?.images).toEqual([
      {
        url: "/social-preview.png",
        width: 1200,
        height: 630,
        alt: "eQOURSE+ expert network team",
      },
    ]);
  });
});
