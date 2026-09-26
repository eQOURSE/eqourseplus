import styles from "./home-redesign.module.css";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "./motion";

const standards = [
  ["Dual-jurisdiction structure", "Incorporated entities in Singapore and India provide contract enforcement, IP protection, and cross-border security."],
  ["ISO 9001:2015 Certified", "Standardized quality management frameworks across all data ingestion, annotation, and content creation pipelines."],
  ["ISO/IEC 27001 Certified", "Data security protocols safeguarding client IP, confidential training datasets, and corporate intelligence."],
  ["Proctored talent testing", "Contributors prove capability inside monitored, domain-specific evaluation environments, no self-declared resumes."],
  ["20+ Years Content services", "Decades of content and academic delivery experience underpin every workflow on the platform"],
] as const;

export function TrustSection() {
  return (
    <section id="trust" className={styles.section} data-home-region aria-labelledby="trust-title">
      <div className={styles.inner}>
        <FadeIn className={`${styles.sectionHeading} ${styles.centeredHeading}`}>
          <p>Trust, security and governance</p><h2 id="trust-title">Institutional Governance You Can Rely On</h2>
          <span>Quality, security and accountability across the delivery lifecycle.</span>
        </FadeIn>
        <FadeInStagger className={styles.standardsGrid} staggerDelay={0.1}>
          {standards.map(([title, body], index) =>
            <FadeInStaggerItem key={title}>
              <article>
                <span aria-hidden="true">{["◎", "⌁", "◇", "⌂" , "◎"][index]}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            </FadeInStaggerItem>
          )}
        </FadeInStagger>
      </div>
    </section>
  );
}
