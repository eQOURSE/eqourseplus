import Link from "next/link";

import { IconArrow, IconArrowUpRight, IconCheck } from "./icons";
import { EnterpriseArt, ExpertArt, VendorArt } from "./pillar-art";
import { segment, type SegmentId } from "./segments";
import { Stack } from "./stack";

interface Pillar {
  id: SegmentId;
  title: string;
  body: string;
  bullets: readonly string[];
}

const pillars: readonly Pillar[] = [
  {
    id: "expert",
    title: "Work Anywhere, Anytime.",
    body: "With Clear Standards, Guaranteed Pay, and Real Recognition.",
    bullets: [
      "Complete location and schedule freedom — choose when and how much you work, from anywhere in the world, with no mandatory shifts.",
      "Transparent workflows and real-time rubrics — review detailed project criteria, golden benchmarks, and guidelines before you start.",
      "Prompt, on-record payouts — every approved milestone is logged to your personal ledger and paid on a predictable weekly or bi-weekly schedule.",
      "No algorithmic bans — no automated terminations; receive human feedback and alignment opportunities whenever adjustments are needed.",
    ],
  },
  {
    id: "vendor",
    title: "Big Projects from Frontier Labs.",
    body: "Structured Delivery and Reliable Cash Flow.",
    bullets: [
      "Direct access to Tier-1 contracts — connect your workforce directly to high-volume projects from frontier AI labs and publishers.",
      "Clear work orders and scoped batches — receive detailed statements of work, verified delivery quotas, and standardized annotation tools.",
      "Predictable milestone-based settlements — structured settlements under Singapore and India legal frameworks, fully GST and TDS compliant.",
      "Unified vendor workspace — track team seat allocations, monitor internal IAA scores, and audit billable output from a single dashboard.",
    ],
  },
  {
    id: "enterprise",
    title: "Deploy Verified Domain Authorities.",
    body: "With Total Workflow Observability.",
    bullets: [
      "Pre-screened subject-matter authorities — automated KYC and proctored assessments across STEM, coding, medicine, law, and 30+ languages.",
      "100% workflow observability — gain complete visibility into task throughput, real-time IAA (>0.85), and comprehensive audit trails.",
      "Guaranteed timelines and SLA controls — dedicated project managers and structured quality checkpoints ensure on-schedule delivery.",
      "Superior ROI — high-accuracy output reduces downstream model rework, validation effort, and data-cleaning costs.",
    ],
  },
] as const;

const ART = { expert: ExpertArt, vendor: VendorArt, enterprise: EnterpriseArt } as const;

function splitBullet(text: string): [string, string] {
  const [lead, ...rest] = text.split(" — ");
  return [lead ?? text, rest.join(" — ")];
}

export function Pillars() {
  return (
    <section id="categories" className="lx-section lx-pillars" data-home-region aria-labelledby="categories-title">
      <div className="lx-container">
        <header className="lx-head lx-reveal">
          <p className="lx-eyebrow">The three-sided ecosystem</p>
          <h2 id="categories-title" className="lx-display lx-h2">
            Built for the <span className="lx-serif lx-ink-grad">Three Pillars</span> of Modern AI &amp; Content Delivery
          </h2>
          <p className="lx-lede">Experts, agencies and enterprise clients share one transparent delivery network.</p>
        </header>

        <Stack>
          {pillars.map((pillar, index) => {
            const seg = segment(pillar.id);
            const Art = ART[pillar.id];
            return (
              <article key={pillar.id} className={`lx-pillar lx-glass lx-spot lx-pillar--${pillar.id}`}>
                <div className="lx-pillar__top">
                  <div className="lx-pillar__copy">
                    <p className="lx-pillar__meta">
                      <span className="lx-pillar__num">{String(index + 1).padStart(2, "0")}</span>
                      <span>{seg.audience}</span>
                    </p>
                    <h3 className="lx-display lx-pillar__title">{pillar.title}</h3>
                    <p className="lx-serif lx-pillar__body">{pillar.body}</p>
                    <div className="lx-pillar__ctas">
                      <Link href={seg.href} className="lx-btn lx-btn--primary" data-magnetic>
                        {seg.cta}
                        <span className="lx-btn__arrow"><IconArrow /></span>
                      </Link>
                      <Link href={seg.learnMoreHref} className="lx-link">
                        {seg.learnMore} <IconArrowUpRight width={16} height={16} />
                      </Link>
                    </div>
                  </div>
                  <div className="lx-pillar__art">
                    <Art />
                  </div>
                </div>
                <ul className="lx-pillar__list" aria-label={pillar.title}>
                  {pillar.bullets.map((bullet) => {
                    const [lead, detail] = splitBullet(bullet);
                    return (
                      <li key={bullet}>
                        <span className="lx-pillar__tick"><IconCheck /></span>
                        <span>
                          <strong>{lead}</strong>
                          {detail ? <> — {detail}</> : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </Stack>
      </div>
    </section>
  );
}
