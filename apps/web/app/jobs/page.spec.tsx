import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JobsPage, { metadata } from "./page";

afterEach(cleanup);

function expectNoUnsupportedJobContent(container: HTMLElement): void {
  container.querySelectorAll("script").forEach((script) => script.remove());
  const text = container.textContent ?? "";
  const textWithoutDates = text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");

  expect(text).not.toMatch(/\u20b9|\$|\u20ac|\u00a3/);
  expect(text).not.toMatch(
    /\b(?:rate|salary|earnings?|payment|pay)\b|\bearn(?:s|ed)?\s+up\s+to\b/i,
  );
  expect(text).not.toMatch(
    /\b(?:Razorpay|Cashfree|Stripe|PayPal|DocuSign|Dropbox Sign|Digio|Leegality|IDfy|HyperVerge|Sumsub|Onfido|Persona|Veriff)\b/i,
  );
  expect(textWithoutDates.match(/\d[\d+]*/g) ?? []).toEqual([]);
}

describe("FR-PUB-02 jobs listing", () => {
  it("sets page metadata to noindex", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("renders an SSR-friendly jobs heading, filters, and seeded job links", async () => {
    const { container } = render(await JobsPage({ searchParams: {} }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find work that values proof and quality",
    );
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view job/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
    expect(container.querySelector(".q-page")).toBeInTheDocument();
    expect(container.querySelector(".jobs-shell, .jobs-card, .freelancer-hero")).toBeNull();
  });

  it("applies category and language query filters", async () => {
    render(
      await JobsPage({
        searchParams: { category: "AI Data Services", language: "Hindi" },
      }),
    );

    expect(screen.getAllByText("Hindi AI response evaluator").length).toBeGreaterThan(0);
    expect(screen.queryByText("English curriculum reviewer")).not.toBeInTheDocument();
  });

  it("offers a way back to all jobs when filters match nothing", async () => {
    render(await JobsPage({ searchParams: { category: "Unknown" } }));

    expect(screen.getByRole("status")).toHaveTextContent("No jobs match these filters.");
    expect(screen.getByRole("link", { name: /clear filters/i })).toHaveAttribute("href", "/jobs");
  });

  it("contains no unsupported claims, providers, or non-date numbers", async () => {
    const { container } = render(await JobsPage({ searchParams: {} }));

    const listing = container.querySelector("#main-content");
    expect(listing).not.toBeNull();
    expectNoUnsupportedJobContent(listing as HTMLElement);
  });
});
