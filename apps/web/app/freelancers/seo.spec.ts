import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  FREELANCERS_DESCRIPTION,
  FREELANCERS_TITLE,
} from "./freelancers-data";
import FreelancersPage, { metadata } from "./page";

describe("FR-PUB-03 metadata", () => {
  it("uses the approved keyword-first title and bounded description", () => {
    expect(FREELANCERS_TITLE).toBe(
      "Freelance AI Data & Content Work | eQOURSE+",
    );
    expect(FREELANCERS_TITLE).toHaveLength(43);
    expect(FREELANCERS_DESCRIPTION).toBe(
      "Build a verified freelancer profile, take proctored skill tests, join tiered project teams, deliver through QA, and receive country-aware payouts.",
    );
    expect(FREELANCERS_DESCRIPTION).toHaveLength(146);
  });

  it("sets canonical, language alternates, and complete social metadata", () => {
    expect(metadata.alternates).toEqual({
      canonical: "/freelancers",
      languages: {
        en: "/freelancers",
        "x-default": "/freelancers",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "/freelancers",
      title: FREELANCERS_TITLE,
      description: FREELANCERS_DESCRIPTION,
      siteName: "eQOURSE+",
      locale: "en",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: FREELANCERS_TITLE,
      description: FREELANCERS_DESCRIPTION,
    });
  });

  it("serializes structured data safely", () => {
    const { container } = render(createElement(FreelancersPage));

    for (const script of container.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      expect(script.textContent).not.toContain("<");
      expect(() => JSON.parse(script.textContent ?? "")).not.toThrow();
    }
  });
});
