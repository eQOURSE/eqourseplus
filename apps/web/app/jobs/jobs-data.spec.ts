import { describe, expect, it } from "vitest";

import {
  getJobBySlug,
  getJobPostingStructuredData,
  getJobs,
  JOB_CATEGORIES,
  JOB_LANGUAGES,
} from "./jobs-data";

describe("FR-PUB-02 seeded jobs", () => {
  it("provides published jobs with filterable category and language fields", () => {
    expect(getJobs()).not.toHaveLength(0);
    expect(getJobs().every((job) => job.category && job.languages.length)).toBe(
      true,
    );
    expect(JOB_CATEGORIES).toContain("AI Data Services");
    expect(JOB_LANGUAGES).toContain("English");
  });

  it("filters jobs by category and language without mutating the seed", () => {
    const all = getJobs();
    const filtered = getJobs({ category: "AI Data Services", language: "Hindi" });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((job) => job.category === "AI Data Services")).toBe(true);
    expect(filtered.every((job) => job.languages.includes("Hindi"))).toBe(true);
    expect(getJobs()).toEqual(all);
  });

  it("generates valid JobPosting JSON-LD for every job detail", () => {
    const job = getJobBySlug(getJobs()[0]!.slug)!;
    const schema = getJobPostingStructuredData(job);

    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description,
      datePosted: job.datePosted,
      hiringOrganization: { "@id": "https://plus.eqourse.com/#organization" },
      jobLocationType: "TELECOMMUTE",
    });
    expect(schema.url).toBe(`https://plus.eqourse.com/jobs/${job.slug}`);
  });
});
