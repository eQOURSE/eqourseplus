import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../components/public/site-chrome";
import { getJobs, JOB_CATEGORIES, JOB_LANGUAGES } from "./jobs-data";

export const metadata: Metadata = {
  title: "Jobs for Verified Talent | eQOURSE+",
  description:
    "Explore open project work across AI data services, content services, and tutoring at eQOURSE+.",
  robots: {
    index: false,
  },
  alternates: {
    canonical: "/jobs",
    languages: { en: "/jobs", "x-default": "/jobs" },
  },
  openGraph: {
    type: "website",
    url: "/jobs",
    title: "Jobs for Verified Talent | eQOURSE+",
    description:
      "Explore open project work across AI data services, content services, and tutoring at eQOURSE+.",
    siteName: "eQOURSE+",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobs for Verified Talent | eQOURSE+",
    description:
      "Explore open project work across AI data services, content services, and tutoring at eQOURSE+.",
  },
};

type JobsPageProps = { searchParams: { category?: string; language?: string } };

export default function JobsPage({ searchParams }: JobsPageProps) {
  const jobs = getJobs(searchParams);
  return (
    <main id="top" className="home-shell jobs-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="jobs" />
      <section
        className="freelancer-hero jobs-hero"
        aria-labelledby="jobs-title"
      >
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">Open project work</p>
          <h1 id="jobs-title">
            Find work that values{" "}
            <span className="text-gradient">proof and quality</span>
          </h1>
          <p className="freelancer-hero-copy">
            Browse seeded opportunities across eQOURSE and TUTRAIN service
            lines. Public listings describe the work; matching confirms the
            project details.
          </p>
        </div>
      </section>
      <section
        className="home-section jobs-listing"
        aria-labelledby="open-jobs-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading home-section-heading--split">
            <div>
              <p className="home-eyebrow">The board</p>
              <h2 id="open-jobs-title" className="home-section-title">
                Current opportunities
              </h2>
            </div>
            <p>{jobs.length} opportunities shown</p>
          </div>
          <form className="jobs-filters" method="get" aria-label="Filter jobs">
            <label>
              Category
              <select
                name="category"
                defaultValue={searchParams.category ?? ""}
              >
                <option value="">All categories</option>
                {JOB_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Language
              <select
                name="language"
                defaultValue={searchParams.language ?? ""}
              >
                <option value="">All languages</option>
                {JOB_LANGUAGES.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
            <button
              className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular"
              type="submit"
            >
              Apply filters
            </button>
          </form>
          <div className="jobs-grid">
            {jobs.length ? (
              jobs.map((job) => (
                <article
                  className="eq-glass-surface eq-glass-tier-regular jobs-card"
                  key={job.slug}
                >
                  <p className="home-eyebrow">{job.category}</p>
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <p className="jobs-card-meta">
                    {job.languages.join(" · ")} · {job.workType}
                  </p>
                  <a
                    className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta"
                    href={`/jobs/${job.slug}`}
                  >
                    <span>View job</span>
                    <ArrowMark />
                  </a>
                </article>
              ))
            ) : (
              <p role="status">No jobs match these filters.</p>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
