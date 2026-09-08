import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JobDetailPage, { generateMetadata } from "./page";
import { getJobs } from "../jobs-data";

afterEach(cleanup);

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
});
