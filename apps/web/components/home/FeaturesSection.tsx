import Link from "next/link";
import styles from "./home-redesign.module.css";

const pillars = [
  { title: "Work Anywhere, Anytime. With Clear Standards and Milestone Pay.", body: "For independent experts and freelancers.", bullets: ["Complete location and schedule freedom", "Transparent workflows and real-time rubrics", "On-record payouts", "No algorithmic bans"], cta: "Start Your Expert Application", href: "/register/freelancer", more: "More for freelancers", moreHref: "/freelancers" },
  { title: "Enterprise Contracts. Structured Delivery and Predictable Settlement.", body: "For vendor teams and delivery agencies.", bullets: ["Enterprise and AI-lab pipelines", "Clear work orders and scoped batches", "Milestone-based settlement", "Unified vendor workspace"], cta: "Apply for Agency Accreditation", href: "/register/vendor", more: "More for vendors", moreHref: "/vendors" },
  { title: "Deploy Verified Domain Authorities with Total Workflow Observability.", body: "For frontier labs and enterprise clients.", bullets: ["Pre-screened subject-matter authorities", "Full workflow observability", "Defined timelines and SLA controls", "Value that compounds downstream"], cta: "Deploy Expert Teams", href: "/register/client", more: "How we work with enterprises", moreHref: "/about" },
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
              <ul className="home-pillar-list">{pillar.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href={pillar.href}>{pillar.cta}<span aria-hidden="true">→</span></Link>
              <Link className="home-inline-link" href={pillar.moreHref}>{pillar.more} →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
