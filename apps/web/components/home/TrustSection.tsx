import styles from "./home-redesign.module.css";

const standards = [
  ["Dual-Jurisdiction Stability", "Incorporated entities in Singapore and India provide contract enforcement, IP protection, and cross-border security."],
  ["ISO 9001:2015 Certified", "Standardized quality management frameworks across all data ingestion, annotation, and content creation pipelines."],
  ["ISO 27001:2013 Certified", "Data security protocols safeguarding client IP, confidential training datasets, and corporate intelligence."],
  ["Proctored Talent Testing", "Contributors prove capability inside monitored, domain-specific evaluation environments, no self-declared resumes."],
  ["20+ Years in Content Services", "Decades of content and academic delivery experience underpin every workflow on the platform."],
] as const;

export function TrustSection() {
  return (
    <section id="trust" className={styles.section} data-home-region aria-labelledby="trust-title">
      <div className={styles.inner}>
        <div className={`${styles.sectionHeading} ${styles.centeredHeading}`}>
          <p>Trust, Security &amp; Global Infrastructure</p><h2 id="trust-title">Institutional Governance You Can Rely On</h2>
          <span>Quality, security and accountability across the delivery lifecycle.</span>
        </div>
        <div className={styles.standardsGrid}>{standards.map(([title, body], index) =>
          <article key={title}><span aria-hidden="true">{["◎", "⌁", "◇", "⌂", "◌"][index]}
          </span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </article>)}</div>
      </div>
    </section>
  );
}
