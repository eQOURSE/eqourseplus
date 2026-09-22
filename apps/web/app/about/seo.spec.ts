import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import sitemap from "../sitemap";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import {
  ABOUT_DESCRIPTION,
  ABOUT_TITLE,
} from "./about-data";
import AboutPage, { metadata } from "./page";

describe("FR-PUB-05 metadata", () => {
  it("uses the approved keyword-first title and bounded description", () => {
    expect(ABOUT_TITLE).toBe(
      "About eQOURSE+ | Verified AI Data & Content Talent Network",
    );
    expect(ABOUT_TITLE).toHaveLength(58);
    expect(ABOUT_DESCRIPTION).toBe(
      "eQOURSE+ is the verified talent and vendor network by eQOURSE — KYC-verified specialists and accredited agencies for AI data and multilingual content.",
    );
    expect(ABOUT_DESCRIPTION).toHaveLength(150);
  });

  it("sets canonical, language alternates, and complete social metadata", () => {
    expect(metadata.alternates).toEqual({
      canonical: "/about",
      languages: {
        en: "/about",
        "x-default": "/about",
      },
    });
    expect(metadata.openGraph).toEqual({
      type: "website",
      url: "/about",
      title: ABOUT_TITLE,
      description: ABOUT_DESCRIPTION,
      siteName: "eQOURSE+",
      locale: "en",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: ABOUT_TITLE,
      description: ABOUT_DESCRIPTION,
      images: [
        {
          url: "/opengraph-image",
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    });
  });

  it("serializes structured data safely", () => {
    const { container } = render(createElement(AboutPage));

    for (const script of container.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      expect(script.textContent).not.toContain("<");
      expect(() => JSON.parse(script.textContent ?? "")).not.toThrow();
    }
  });

  it("publishes the about route in the sitemap", () => {
    expect(
      sitemap().map((entry) => new URL(entry.url).pathname),
    ).toContain("/about");
  });
});
