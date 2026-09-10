import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JobDetailPage, { generateMetadata } from "./page";
import { getJobs } from "../jobs-data";

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

describe("FR-PUB-02 job detail", () => {
  it("renders the job and its JobPosting JSON-LD", async () => {
    const job = getJobs()[0]!;
    render(await JobDetailPage({ params: { slug: job.slug } }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(job.title);
    expect(screen.getByText(job.description)).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain(
      '"@type":"JobPosting"',
    );
  });

  it("sets a self-canonical metadata entry", async () => {
    const job = getJobs()[0]!;
    const metadata = await generateMetadata({ params: { slug: job.slug } });

    expect(metadata.alternates?.canonical).toBe(`/jobs/${job.slug}`);
  });

  it("sets page metadata to noindex", async () => {
    const job = getJobs()[0]!;
    const metadata = await generateMetadata({ params: { slug: job.slug } });

    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("contains no unsupported claims, providers, or non-date numbers", async () => {
    const job = getJobs()[0]!;
    const { container } = render(await JobDetailPage({ params: { slug: job.slug } }));

    expectNoUnsupportedJobContent(container);
  });
});
