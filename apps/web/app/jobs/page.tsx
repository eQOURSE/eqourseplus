import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import { getJobs, JOB_CATEGORIES, JOB_LANGUAGES } from "./jobs-data";
import styles from "./jobs-page.module.css";

export const metadata: Metadata = {
  title: "Jobs for Verified Talent | eQOURSE+",
  description: "Explore open project work across AI data services, content services, and tutoring at eQOURSE+.",
  robots: { index: false },
  alternates: { canonical: "/jobs", languages: { en: "/jobs", "x-default": "/jobs" } },
  openGraph: {
    type: "website", url: "/jobs", title: "Jobs for Verified Talent | eQOURSE+",
    description: "Explore open project work across AI data services, content services, and tutoring at eQOURSE+.",
    siteName: "eQOURSE+", locale: "en",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image", title: "Jobs for Verified Talent | eQOURSE+",
    description: "Explore open project work across AI data services, content services, and tutoring at eQOURSE+.",
    images: [{ url: "/opengraph-image", alt: SOCIAL_IMAGE_ALT }],
  },
};

type JobsPageProps = { searchParams: { category?: string; language?: string } };

export default function JobsPage({ searchParams }: JobsPageProps) {
  const jobs = getJobs(searchParams);

  return (
    <div className={`q q-page ${styles.page}`}>
      <a className="q-skip" href="#main-content">Skip to content</a>
      <HomeHeader />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="jobs-title">
          <div className={styles.heroImage} aria-hidden="true">
            <Image src="/images/tracks/rlhf.png" alt="" fill priority sizes="(max-width: 760px) 100vw, 55vw" />
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={`q-container ${styles.heroContent}`}>
            <p className={styles.kicker}>eQOURSE+ / project work</p>
            <h1 id="jobs-title" className="q-display">Find work that values <span>proof and quality</span></h1>
            <p className={styles.heroCopy}>Explore project paths across AI data, content, and tutoring. Matching confirms the details of each assignment.</p>
            <a className={styles.heroLink} href="#opportunities">Explore opportunities <span aria-hidden="true">↘</span></a>
          </div>
        </section>

        <section id="opportunities" className={`q-container ${styles.listing}`} aria-labelledby="open-jobs-title">
          <div className={styles.intro}>
            <div>
              <p className={styles.sectionLabel}>The work</p>
              <h2 id="open-jobs-title" className="q-display">Current opportunities</h2>
            </div>
            <p>Sample project briefs. Browse by discipline and language to find work that fits your skills.</p>
          </div>

          <form className={styles.filters} method="get" aria-label="Filter jobs">
            <label>Category
              <select name="category" defaultValue={searchParams.category ?? ""}>
                <option value="">All categories</option>
                {JOB_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>Language
              <select name="language" defaultValue={searchParams.language ?? ""}>
                <option value="">All languages</option>
                {JOB_LANGUAGES.map((language) => <option key={language}>{language}</option>)}
              </select>
            </label>
            <button type="submit">Apply filters <span aria-hidden="true">→</span></button>
          </form>

          <div className={styles.results}>
            {jobs.length ? jobs.map((job) => (
              <article className={styles.job} key={job.slug}>
                <div className={styles.jobType}>
                  <span className={styles.jobMarker} aria-hidden="true">↗</span>
                  <span>{job.category}</span>
                </div>
                <div className={styles.jobBody}>
                  <h3 className="q-display">{job.title}</h3>
                  <p>{job.description}</p>
                  <p className={styles.jobMeta}>{job.languages.join(" · ")} <span aria-hidden="true">/</span> {job.workType} based</p>
                </div>
                <Link className={styles.jobLink} href={`/jobs/${job.slug}`} aria-label={`View job: ${job.title}`}>
                  <span>View job</span><span aria-hidden="true">↗</span>
                </Link>
              </article>
            )) : (
              <div className={styles.empty} role="status">
                <span className={styles.emptyArt} aria-hidden="true">◇</span>
                <p>No jobs match these filters.</p>
                <Link href="/jobs">Clear filters <span aria-hidden="true">→</span></Link>
              </div>
            )}
          </div>
          <p className={styles.disclaimer}>These sample briefs illustrate the kinds of projects eQOURSE+ supports. Project details are confirmed during matching.</p>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
