import styles from "./home-redesign.module.css";

const standards = [
  ["Dual-jurisdiction structure", "Entities in Singapore and India supporting contract enforcement, IP protection and cross-border payment."],
  ["ISO 9001:2015", "Standardised quality management across data ingestion, annotation and content pipelines."],
  ["ISO/IEC 27001", "Information security protocols safeguarding client IP, confidential training data and corporate intelligence."],
  ["Proctored talent testing", "Contributors prove capability inside monitored, domain-specific assessment environments rather than self-declared résumés."],
] as const;

export function TrustSection() {
  return (
    <section id="trust" className={styles.section} data-home-region aria-labelledby="trust-title">
      <div className={styles.inner}>
        <div className={`${styles.sectionHeading} ${styles.centeredHeading}`}>
          <p>Trust, security and governance</p><h2 id="trust-title">Institutional Governance You Can Rely On</h2>
          <span>Quality, security and accountability across the delivery lifecycle.</span>
        </div>
        <div className={styles.standardsGrid}>{standards.map(([title, body], index) =>
          <article key={title}><span aria-hidden="true">{["◎", "⌁", "◇", "⌂"][index]}
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
