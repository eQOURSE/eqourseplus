"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";

import {
  IconArrow,
  IconArrowUpRight,
  SEGMENT_ICONS,
} from "./icons";
import { segment, type SegmentId } from "./segments";

interface Pillar {
  id: SegmentId;
  tab: string;
  audience: string;
  title: string;
  subtitle: string;
  cta: string;
  artwork: string;
  artworkAlt: string;
  benefits: ReadonlyArray<{ thumbnail: string; title: string; body: string }>;
}

const PILLARS: readonly Pillar[] = [
  {
    id: "expert",
    tab: "Experts",
    audience: "For Independent Experts & Freelancers",
    title: "Work Anywhere, Anytime.",
    subtitle: "With Clear Standards, Guaranteed Pay, and Real Recognition.",
    cta: "Start Your Expert Application",
    artwork: "/images/pillars/expert.png",
    artworkAlt: "Independent expert working on a digital project",
    benefits: [
      {
        thumbnail: "/images/benefits/expert-location.png",
        title: "Complete Location & Schedule Freedom",
        body: "Choose when and how much you work from anywhere in the world, no mandatory shifts.",
      },
      {
        thumbnail: "/images/benefits/expert-rubrics.png",
        title: "Transparent Workflows & Real-Time Rubrics",
        body: "Review detailed project criteria, golden benchmarks, and guidelines before you start.",
      },
      {
        thumbnail: "/images/benefits/expert-payouts.png",
        title: "Prompt, On-Record Payouts",
        body: "Every approved milestone logs to your personal ledger, paid on a predictable weekly or bi-weekly schedule.",
      },
      {
        thumbnail: "/images/benefits/expert-feedback.png",
        title: "No Algorithmic Bans",
        body: "No automated terminations; receive human feedback and alignment opportunities if adjustments are needed.",
      },
    ],
  },
  {
    id: "vendor",
    tab: "Agencies",
    audience: "For Vendor Teams & Delivery Agencies",
    title: "Big Projects from Frontier Labs.",
    subtitle: "Structured Delivery and Reliable Cash Flow.",
    cta: "Apply for Agency Accreditation",
    artwork: "/images/pillars/agency.png",
    artworkAlt: "Agency team collaborating on a shared delivery project",
    benefits: [
      {
        thumbnail: "/images/benefits/agency-contracts.png",
        title: "Direct Access to Tier-1 Contracts",
        body: "Connect your workforce directly to high-volume contracts from frontier AI labs and publishers.",
      },
      {
        thumbnail: "/images/benefits/agency-batches.png",
        title: "Clear Work Orders & Scoped Batches",
        body: "Receive detailed SOWs, verified delivery quotas, and standardized annotation tools.",
      },
      {
        thumbnail: "/images/benefits/agency-settlements.png",
        title: "Predictable, Milestone-Based Settlements",
        body: "Structured settlements under Singapore & India legal frameworks (GST and TDS compliant).",
      },
      {
        thumbnail: "/images/benefits/agency-workspace.png",
        title: "Unified Vendor Workspace",
        body: "Track team seat allocations, monitor internal IAA scores, and audit billable output in one dashboard.",
      },
    ],
  },
  {
    id: "enterprise",
    tab: "Enterprises",
    audience: "For Frontier Labs & Enterprise Clients",
    title: "Deploy Verified Domain Authorities",
    subtitle: "with Total Workflow Observability.",
    cta: "Schedule an Enterprise Consultation",
    artwork: "/images/pillars/enterprise.png",
    artworkAlt: "Enterprise team reviewing project delivery",
    benefits: [
      {
        thumbnail: "/images/benefits/enterprise-authorities.png",
        title: "Pre-Screened Subject-Matter Authorities",
        body: "Automated KYC and proctored assessments across STEM, Coding, Medicine, Law, and 30+ Languages.",
      },
      {
        thumbnail: "/images/benefits/enterprise-observability.png",
        title: "100% Workflow Observability",
        body: "Full pipeline visibility, task throughput, real-time IAA (greater than 0.85), and complete audit trails.",
      },
      {
        thumbnail: "/images/benefits/enterprise-timelines.png",
        title: "Guaranteed Timelines & SLA Controls",
        body: "Dedicated project managers and structured quality checkpoints ensure on-schedule delivery.",
      },
      {
        thumbnail: "/images/benefits/enterprise-value.png",
        title: "Superior Value for Money (ROI)",
        body: "High-accuracy output that drastically cuts downstream model rework and data cleaning costs.",
      },
    ],
  },
];

const COUNT = PILLARS.length;

/**
 * "Who are you?" switcher: one audience at a time, so each visitor reads
 * only what applies to them. Every panel stays in the server HTML.
 */
export function Pillars() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const tabsRef = useRef<HTMLDivElement>(null);

  const select = (index: number, focus = false) => {
    const next = ((index % COUNT) + COUNT) % COUNT;
    setActive(next);
    if (focus) tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: COUNT - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  };

  return (
    <section id="categories" className="q-section q-pillars" data-home-region aria-labelledby="categories-title">
      <div className="q-container">
        <header className="q-head q-head--center q-reveal">
          <p className="q-eyebrow"><span className="q-eyebrow__idx">01</span>Who we empower</p>
          <h2 id="categories-title" className="q-display q-h2">
            Built for the <span className="q-grad">Three Pillars</span> of Modern AI &amp; Content Delivery
          </h2>
        </header>

        <div className="q-aud q-reveal" style={{ "--d": 1 } as CSSProperties}>
          <div ref={tabsRef} className="q-aud__tabs" role="tablist" aria-label="Choose who you are">
            {PILLARS.map((pillar, index) => {
              const Icon = SEGMENT_ICONS[pillar.id];
              const selected = index === active;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  role="tab"
                  id={`pillar-tab-${pillar.id}`}
                  aria-controls={`pillar-panel-${pillar.id}`}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  className="q-aud__tab"
                  onClick={() => select(index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  {selected ? (
                    <motion.span
                      layoutId="q-aud-thumb"
                      className="q-aud__thumb"
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <Icon aria-hidden="true" />
                  <span>{pillar.tab}</span>
                </button>
              );
            })}
          </div>

          {PILLARS.map((pillar, index) => {
            const seg = segment(pillar.id);
            return (
              <div
                key={pillar.id}
                id={`pillar-panel-${pillar.id}`}
                role="tabpanel"
                aria-labelledby={`pillar-tab-${pillar.id}`}
                hidden={index !== active}
                className={`q-aud__panel q-aud__panel--${pillar.id}`}
              >
                <div className="q-aud__visual">
                  <span className="q-plusgrid" aria-hidden="true" />
                  <div className="q-aud__artwork-frame">
                    <Image
                      src={pillar.artwork}
                      alt={pillar.artworkAlt}
                      fill
                      sizes="(max-width: 700px) 85vw, (max-width: 1100px) 42vw, 510px"
                      className="q-aud__artwork"
                    />
                  </div>
                </div>

                <div className="q-aud__body">
                  <p className="q-aud__audience">{pillar.audience}</p>
                  <h3 className="q-display q-aud__title">
                    {pillar.title} <span>{pillar.subtitle}</span>
                  </h3>

                  <ul className="q-aud__benefits">
                    {pillar.benefits.map(({ thumbnail, title, body }) => (
                      <li key={title}>
                        <span className="q-aud__benefit-thumb" aria-hidden="true">
                          <Image
                            src={thumbnail}
                            alt=""
                            width={88}
                            height={88}
                            className="q-aud__benefit-artwork"
                          />
                        </span>
                        <strong>{title}</strong>
                        <p>{body}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="q-aud__ctas">
                    <Link href={seg.href} className="q-btn q-btn--primary" data-magnetic>
                      {pillar.cta}
                      <span className="q-btn__icon"><IconArrow /><IconArrow /></span>
                    </Link>
                    <Link href={seg.learnMoreHref} className="q-link">
                      {seg.learnMore} <IconArrowUpRight />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
