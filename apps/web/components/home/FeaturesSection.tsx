import Link from "next/link";
import styles from "./home-redesign.module.css";

const pillars = [
  { title: "Work Anywhere, Anytime. With Clear Standards, Guaranteed Pay, and Real Recognition.", body: "For Independent Experts & Freelancers", bullets: ["Complete Location & Schedule Freedom: Choose when and how much you work from anywhere in the world, no mandatory shifts.", "Transparent Workflows & Real-Time Rubrics: Review detailed project criteria, golden benchmarks, and guidelines before you start.", "Prompt, On-Record Payouts: Every approved milestone logs to your personal ledger, paid on a predictable weekly or bi-weekly schedule.", "No Algorithmic Bans: No automated terminations, receive human feedback and alignment opportunities if adjustments are needed."], cta: "Start Your Expert Application", href: "/register/freelancer", more: "More for freelancers", moreHref: "/freelancers" },
  { title: "Big Projects from Frontier Labs. Structured Delivery and Reliable Cash Flow.", body: "For Vendor Teams & Delivery Agencies", bullets: ["Direct Access to Tier-1 Contracts: Connect your workforce directly to high-volume contracts from frontier AI labs and publishers.", "Clear Work Orders & Scoped Batches: Receive detailed SOWs, verified delivery quotas, and standardized annotation tools.", "Predictable, Milestone-Based Settlements: Structured settlements under Singapore & India legal frameworks (GST and TDS compliant).", "Unified Vendor Workspace: Track team seat allocations, monitor internal IAA scores, and audit billable output in one dashboard."], cta: "Apply for Agency Accreditation", href: "/register/vendor", more: "More for vendors", moreHref: "/vendors" },
  { title: "Deploy Verified Domain Authorities with Total Workflow Observability.", body: "For Frontier Labs & Enterprise Clients", bullets: ["Pre-Screened Subject-Matter Authorities: Automated KYC and proctored assessments across STEM, Coding, Medicine, Law, and 30+ Languages.", "100% Workflow Observability: Full pipeline visibility, task throughput, real time IAA (greater than 0.85), and complete audit trails.", "Guaranteed Timelines & SLA Controls: Dedicated project managers and structured quality checkpoints ensure on-schedule delivery.", "Superior Value for Money (ROI): High-accuracy output that drastically cuts downstream model rework and data cleaning costs."], cta: "Schedule an Enterprise Consultation", href: "/register/client", more: "How we work with enterprises", moreHref: "/about" },
] as const;

export function FeaturesSection() {
  return (
    <section id="categories" className={styles.section} data-home-region aria-labelledby="categories-title">
      <div className={styles.inner}>
        <div className={styles.sectionHeading}>
          <p>The three-sided ecosystem</p>
          <h2 id="categories-title">Built for the Three Pillars of Modern AI &amp; Content Delivery</h2>
          <span>Experts, agencies and enterprise clients share one transparent delivery network.</span>
        </div>
        <div className={styles.advantageGrid}>
          {pillars.map((pillar) => (
            <article key={pillar.title}>
              <span className={styles.cardIndex} aria-hidden="true">✦</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
              <ul className={styles.pillerList} aria-label={pillar.title}>
                {pillar.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href={pillar.href}>{pillar.cta}<span aria-hidden="true">→</span></Link>
              <Link className="home-inline-link" href={pillar.moreHref}>{pillar.more} →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
