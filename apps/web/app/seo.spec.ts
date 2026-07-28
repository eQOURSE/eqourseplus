import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-plus-jakarta-sans" }),
}));

import { metadata as layoutMetadata } from "./layout";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  structuredData,
} from "./home-data";
import { metadata as pageMetadata } from "./page";
import { RESOLVING_ROUTES, UNBUILT_ROUTES } from "./public-routes";
import robots from "./robots";
import sitemap from "./sitemap";
import HomePage from "./page";

describe("FR-PUB-01 metadata", () => {
  it("keeps keyword-first title and description within Section 18 limits", () => {
    expect(HOME_TITLE).toBe("Verified AI Data & Content Talent | eQOURSE+");
    expect(HOME_TITLE.length).toBeGreaterThan(0);
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
    expect(HOME_DESCRIPTION).toBe(
      "Staff projects with KYC-verified freelancers and vendor agencies across AI data, content and tutoring. ISO 9001 and ISO 27001 certified.",
    );
    expect(HOME_DESCRIPTION.length).toBeGreaterThan(0);
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(155);
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
        url: "/opengraph-image",
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
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "eQOURSE+ brand gradient",
    });
    expect(pageMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [
        {
          url: "/opengraph-image",
          alt: "eQOURSE+ brand gradient",
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

    expect(organization.parentOrganization?.name).toBe(
      "EQOURSE ONLINE EDUCATIONERS LLP",
    );
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
    for (const route of UNBUILT_ROUTES) {
      expect(serialized).not.toContain(`plus.eqourse.com${route}`);
    }
  });
});

describe("FR-PUB-01 social image", () => {
  it("is a static build-time image with the approved dimensions", async () => {
    const imageModule = await import("./opengraph-image");

    expect(imageModule.dynamic).toBe("force-static");
    expect(imageModule.size).toEqual({ width: 1200, height: 630 });
    expect(imageModule.alt).toBe("eQOURSE+ brand gradient");
    expect(imageModule.contentType).toBe("image/svg+xml");
  });
});
