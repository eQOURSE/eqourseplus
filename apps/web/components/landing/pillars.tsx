"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type SVGProps,
  useRef,
  useState,
} from "react";

import {
  IconArrow,
  IconArrowUpRight,
  IconCheck,
  IconClock,
  IconEnterprise,
  IconEye,
  IconGlobe,
  IconLayers,
  IconLedger,
  IconRank,
  IconScale,
  IconScan,
  IconShield,
  IconSpark,
  SEGMENT_ICONS,
} from "./icons";
import { segment, type SegmentId } from "./segments";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Pillar {
  id: SegmentId;
  tab: string;
  audience: string;
  title: string;
  subtitle: string;
  cta: string;
  benefits: ReadonlyArray<{ icon: Icon; title: string; body: string }>;
}

const PILLARS: readonly Pillar[] = [
  {
    id: "expert",
    tab: "Experts",
    audience: "For Independent Experts & Freelancers",
    title: "Work Anywhere, Anytime.",
    subtitle: "With Clear Standards, Guaranteed Pay, and Real Recognition.",
    cta: "Start Your Expert Application",
    benefits: [
      {
        icon: IconGlobe,
        title: "Complete Location & Schedule Freedom",
        body: "Choose when and how much you work from anywhere in the world, no mandatory shifts.",
      },
      {
        icon: IconEye,
        title: "Transparent Workflows & Real-Time Rubrics",
        body: "Review detailed project criteria, golden benchmarks, and guidelines before you start.",
      },
      {
        icon: IconLedger,
        title: "Prompt, On-Record Payouts",
        body: "Every approved milestone logs to your personal ledger, paid on a predictable weekly or bi-weekly schedule.",
      },
      {
        icon: IconShield,
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
    benefits: [
      {
        icon: IconEnterprise,
        title: "Direct Access to Tier-1 Contracts",
        body: "Connect your workforce directly to high-volume contracts from frontier AI labs and publishers.",
      },
      {
        icon: IconLayers,
        title: "Clear Work Orders & Scoped Batches",
        body: "Receive detailed SOWs, verified delivery quotas, and standardized annotation tools.",
      },
      {
        icon: IconScale,
        title: "Predictable, Milestone-Based Settlements",
        body: "Structured settlements under Singapore & India legal frameworks (GST and TDS compliant).",
      },
      {
        icon: IconRank,
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
    benefits: [
      {
        icon: IconScan,
        title: "Pre-Screened Subject-Matter Authorities",
        body: "Automated KYC and proctored assessments across STEM, Coding, Medicine, Law, and 30+ Languages.",
      },
      {
        icon: IconEye,
        title: "100% Workflow Observability",
        body: "Full pipeline visibility, task throughput, real-time IAA (greater than 0.85), and complete audit trails.",
      },
      {
        icon: IconClock,
        title: "Guaranteed Timelines & SLA Controls",
        body: "Dedicated project managers and structured quality checkpoints ensure on-schedule delivery.",
      },
      {
        icon: IconSpark,
        title: "Superior Value for Money (ROI)",
        body: "High-accuracy output that drastically cuts downstream model rework and data cleaning costs.",
      },
    ],
  },
];

/* Decorative product previews: no figures, just the shape of the workflow. */

function ExpertPreview() {
  return (
    <div className="q-pv q-glass">
      <div className="q-pv__head">
        <span className="q-pv__icon"><IconEye /></span>
        <span>
          <b>Task brief</b>
          <small>Rubric and golden examples</small>
        </span>
      </div>
      <ul className="q-pv__checks">
        <li><IconCheck />Criteria reviewed</li>
        <li><IconCheck />Benchmark calibrated</li>
        <li className="is-live"><span className="q-dot" />Human QA in progress</li>
      </ul>
      <span className="q-pv__pill"><IconLedger />Milestone logged to ledger</span>
    </div>
  );
}

function VendorPreview() {
  return (
    <div className="q-pv q-glass">
      <div className="q-pv__head">
        <span className="q-pv__icon"><IconClock /></span>
        <span>
          <b>Work order</b>
          <small>Scoped batch · statement of work</small>
        </span>
      </div>
      <div className="q-pv__team">
        {Array.from({ length: 6 }, (_, index) => (
          <i key={index} style={{ "--i": index } as CSSProperties} />
        ))}
        <span>Team seats allocated</span>
      </div>
      <div className="q-pv__progress"><i /></div>
      <span className="q-pv__pill"><IconCheck />Milestone settlement on schedule</span>
    </div>
  );
}

function EnterprisePreview() {
  return (
    <div className="q-pv q-glass">
      <div className="q-pv__head">
        <span className="q-pv__icon"><IconShield /></span>
        <span>
          <b>Observability</b>
          <small>Throughput, IAA and audit trail</small>
        </span>
      </div>
      <div className="q-pv__bars">
        {[0.45, 0.6, 0.52, 0.72, 0.66, 0.84, 0.78, 0.92].map((height, index) => (
          <i key={index} style={{ "--h": height, "--i": index } as CSSProperties} />
        ))}
      </div>
      <span className="q-pv__pill"><IconCheck />Every task on the audit trail</span>
    </div>
  );
}

const PREVIEW: Record<SegmentId, () => JSX.Element> = {
  expert: ExpertPreview,
  vendor: VendorPreview,
  enterprise: EnterprisePreview,
};

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
            const Preview = PREVIEW[pillar.id];
            return (
              <div
                key={pillar.id}
                id={`pillar-panel-${pillar.id}`}
                role="tabpanel"
                aria-labelledby={`pillar-tab-${pillar.id}`}
                hidden={index !== active}
                className={`q-aud__panel q-aud__panel--${pillar.id}`}
              >
                <div className="q-aud__visual" aria-hidden="true">
                  <span className="q-plusgrid" />
                  <Preview />
                </div>

                <div className="q-aud__body">
                  <p className="q-aud__audience">{pillar.audience}</p>
                  <h3 className="q-display q-aud__title">
                    {pillar.title} <span>{pillar.subtitle}</span>
                  </h3>

                  <ul className="q-aud__benefits">
                    {pillar.benefits.map(({ icon: Icon, title, body }) => (
                      <li key={title}>
                        <span className="q-aud__icon" aria-hidden="true"><Icon /></span>
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
