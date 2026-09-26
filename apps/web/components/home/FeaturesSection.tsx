import Link from "next/link";
import styles from "./home-redesign.module.css";
import { FadeIn, FadeInStagger, FadeInStaggerItem, ScaleOnHover } from "./motion";

// const pillars = [
//   {
//     title: "Work Anywhere, Anytime.",
//     body: "With Clear Standards, Guaranteed Pay, and Real Recognition.",
//     bullets: ["Complete location and schedule freedom — choose when and how much you work, from anywhere, with no mandatory shifts.", "Transparent workflows and real-time rubrics — review project criteria, golden benchmarks and guidelines before you start.",
//       "Prompt, On-record Payouts — every approved milestone logs to your personal ledger , paid on a predictable weekly or bi-weekly schedule.", "No algorithmic Bans — No automated terminations, receive human feedback and alignment opportunities if adjustments are needed."], cta: "Start Your Expert Application", href: "/register/freelancer", more: "More for freelancers", moreHref: "/freelancers"
//   },
//   {
//     title: "For Vendor Teams & Delivery Agencies",
//     body: "For vendor teams and delivery agencies.",
//     bullets: ["Enterprise and AI-lab pipelines — connect your workforce to high-volume annotation, evaluation and content contracts.", "Clear work orders and scoped batches — detailed statements of work, verified delivery quotas and standardised tooling.", "Milestone-based settlement — structured settlements under Singapore and India legal frameworks, GST and TDS compliant.", "Unified vendor workspace — team seat allocation, internal agreement scores and billable output in one dashboard."], cta: "Apply for Agency Accreditation", href: "/register/vendor", more: "More for vendors", moreHref: "/vendors"
//   },
//   {
//     title: "Deploy Verified Domain Authorities with Total Workflow Observability.",
//     body: "For frontier labs and enterprise clients.",
//     bullets: ["Pre-screened subject-matter authorities — KYC verification and proctored assessment across STEM, coding, medicine, law and multilingual work.", "Full workflow observability — inspect task throughput, inter-annotator agreement and complete audit trails.", "Defined timelines and SLA controls — dedicated project managers and structured quality checkpoints.", "Value that compounds downstream — higher first-pass accuracy cuts model rework and data-cleaning cost."], cta: "Deploy Expert Teams", href: "/register/client", more: "How we work with enterprises", moreHref: "/about"
//   },
// ] as const;

const pillars = [
  {
    title: "Work Anywhere, Anytime.",
    body: "With Clear Standards, Guaranteed Pay, and Real Recognition.",
    bullets: [
      "Complete location and schedule freedom — choose when and how much you work, from anywhere in the world, with no mandatory shifts.",
      "Transparent workflows and real-time rubrics — review detailed project criteria, golden benchmarks, and guidelines before you start.",
      "Prompt, on-record payouts — every approved milestone is logged to your personal ledger and paid on a predictable weekly or bi-weekly schedule.",
      "No algorithmic bans — no automated terminations; receive human feedback and alignment opportunities whenever adjustments are needed."
    ],
    cta: "Start Your Expert Application",
    href: "/register/freelancer",
    more: "More for freelancers",
    moreHref: "/freelancers"
  },
  {
    title: "Big Projects from Frontier Labs.",
    body: "Structured Delivery and Reliable Cash Flow.",
    bullets: [
      "Direct access to Tier-1 contracts — connect your workforce directly to high-volume projects from frontier AI labs and publishers.",
      "Clear work orders and scoped batches — receive detailed statements of work, verified delivery quotas, and standardized annotation tools.",
      "Predictable milestone-based settlements — structured settlements under Singapore and India legal frameworks, fully GST and TDS compliant.",
      "Unified vendor workspace — track team seat allocations, monitor internal IAA scores, and audit billable output from a single dashboard."
    ],
    cta: "Apply for Agency Accreditation",
    href: "/register/vendor",
    more: "More for vendors",
    moreHref: "/vendors"
  },
  {
    title: "Deploy Verified Domain Authorities.",
    body: "With Total Workflow Observability.",
    bullets: [
      "Pre-screened subject-matter authorities — automated KYC and proctored assessments across STEM, coding, medicine, law, and 30+ languages.",
      "100% workflow observability — gain complete visibility into task throughput, real-time IAA (>0.85), and comprehensive audit trails.",
      "Guaranteed timelines and SLA controls — dedicated project managers and structured quality checkpoints ensure on-schedule delivery.",
      "Superior ROI — high-accuracy output reduces downstream model rework, validation effort, and data-cleaning costs."
    ],
    cta: "Schedule an Enterprise Consultation",
    href: "/register/client",
    more: "How we work with enterprises",
    moreHref: "/about"
  }
] as const;


export function FeaturesSection() {
  return (
    <section id="categories" className={styles.section} data-home-region aria-labelledby="categories-title">
      <div className={styles.inner}>
        <FadeIn className={styles.sectionHeading}>
          <p>The three-sided ecosystem</p>
          <h2 id="categories-title">Built for the Three Pillars of Modern AI &amp; Content Delivery</h2>
          <span>Experts, agencies and enterprise clients share one transparent delivery network.</span>
        </FadeIn>
        <FadeInStagger className={styles.advantageGrid} staggerDelay={0.15}>
          {pillars.map((pillar) => (
            <FadeInStaggerItem key={pillar.title}>
              <ScaleOnHover scale={1.015}>
                <article>
                  <span className={styles.cardIndex} aria-hidden="true">✦</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                  <ul className={styles.pillerList} style={{ listStyle: "disc" }} aria-label={pillar.title}>
                    {pillar.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <Link className=" eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href={pillar.href}>{pillar.cta}<span aria-hidden="true">→</span></Link>
                </article>
              </ScaleOnHover>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
