import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../../components/public/site-chrome";
import { serializeJsonLd } from "../../../lib/json-ld";
import {
  getJobBySlug,
  getJobs,
  getJobPostingStructuredData,
} from "../jobs-data";

type JobPageProps = { params: { slug: string } };

export function generateStaticParams() {
  return getJobs().map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const job = getJobBySlug(params.slug);
  if (!job) return { title: "Job not found | eQOURSE+" };
  return {
    title: `${job.title} | eQOURSE+`,
    description: job.description,
    robots: {
      index: false,
    },
    alternates: {
      canonical: `/jobs/${job.slug}`,
      languages: { en: `/jobs/${job.slug}`, "x-default": `/jobs/${job.slug}` },
    },
  };
}

export default function JobDetailPage({ params }: JobPageProps) {
  const job = getJobBySlug(params.slug);
  if (!job) notFound();
  return (
    <main id="top" className="home-shell jobs-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="jobs" />
      <article className="home-section job-detail" aria-labelledby="job-title">
        <div className="home-section-inner">
          <a
            className="job-detail-back-link border border-white rounded-full px-5"
            href="/jobs"
          >
            All jobs <ArrowMark />
          </a>
          <p className="home-eyebrow">
            {job.category} · {job.businessUnit}
          </p>
          <h1 id="job-title">{job.title}</h1>
          <p className="job-description">{job.description}</p>
          <dl className="job-facts">
            <div>
              <dt>Languages</dt>
              <dd>{job.languages.join(", ")}</dd>
            </div>
            <div>
              <dt>Work type</dt>
              <dd>{job.workType}</dd>
            </div>
            <div>
              <dt>Rate</dt>
              <dd>{job.rate}</dd>
            </div>
            <div>
              <dt>Required test</dt>
              <dd>{job.requiredTest}</dd>
            </div>
            <div>
              <dt>Quality bar</dt>
              <dd>{job.qualityBar}</dd>
            </div>
          </dl>
          <section aria-labelledby="skills-title">
            <h2 id="skills-title">What this work needs</h2>
            <ul>
              {job.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>
          <a
            className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta"
            href="/register/freelancer"
          >
            <span className="eq-glass-button__label">Become a freelancer</span>
            <ArrowMark />
          </a>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(getJobPostingStructuredData(job)),
        }}
      />
      <SiteFooter />
    </main>
  );
}
