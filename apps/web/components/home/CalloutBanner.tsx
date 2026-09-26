import Link from "next/link";
import styles from "./home-redesign.module.css";
import { FadeIn } from "./motion";

export function CalloutBanner() {
  return (
    <section id="final-cta" className={styles.finalCta} data-home-region aria-labelledby="final-cta-title">
      <div className={styles.ctaGlow} aria-hidden="true" />
      <FadeIn className={styles.inner}>
        <p className={styles.badge}><span aria-hidden="true" />Final call to action</p>
        <h2 id="final-cta-title">Ready to Power the Next Frontier of AI and Content?</h2>
        <p>Whether you are a specialist ready to work on your terms, an agency seeking enterprise-grade pipelines, or a lab building next-generation models — step into an ecosystem designed for clarity, respect and growth.</p>
        <div className={styles.heroActions}>
          <Link className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/freelancer"><span className="eq-glass-button__label">Apply as Domain Expert</span></Link>
          <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/vendor"><span className="eq-glass-button__label">Register as an Vendor Partner</span></Link>
          <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/client"><span className="eq-glass-button__label">Talk to Our Enterprise Solutions Team</span></Link>
        </div>
      </FadeIn>
    </section>
  );
}
