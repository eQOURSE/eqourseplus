import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { SOCIAL_IMAGE_ALT } from "../home-data";
import {
  VENDORS_DESCRIPTION,
  VENDORS_TITLE,
} from "./vendors-data";
import VendorsPage, { metadata } from "./page";

describe("FR-PUB-04 metadata", () => {
  it("uses the approved keyword-first title and bounded description", () => {
    expect(VENDORS_TITLE).toBe(
      "Vendor Agencies for AI Data & Content | eQOURSE+",
    );
    expect(VENDORS_TITLE).toHaveLength(48);
    expect(VENDORS_DESCRIPTION).toBe(
      "Agency verification, capability review, sealed vendor RFPs, team allocation, delivery, and milestone invoicing in the planned eQOURSE+ model.",
    );
    expect(VENDORS_DESCRIPTION).toHaveLength(141);
  });

  it("sets canonical, language alternates, and complete social metadata", () => {
    expect(metadata.alternates).toEqual({
      canonical: "/vendors",
      languages: {
        en: "/vendors",
        "x-default": "/vendors",
      },
    });
    expect(metadata.openGraph).toEqual({
      type: "website",
      url: "/vendors",
      title: VENDORS_TITLE,
      description: VENDORS_DESCRIPTION,
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
      title: VENDORS_TITLE,
      description: VENDORS_DESCRIPTION,
      images: [
        {
          url: "/opengraph-image",
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    });
  });

  it("serializes structured data safely", () => {
    const { container } = render(createElement(VendorsPage));

    for (const script of container.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      expect(script.textContent).not.toContain("<");
      expect(() => JSON.parse(script.textContent ?? "")).not.toThrow();
    }
  });
});
