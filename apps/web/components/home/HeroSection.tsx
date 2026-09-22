import Link from "next/link";

import styles from "./home-redesign.module.css";
import { CockpitPreview } from "./CockpitPreviewInteractive";


export function HeroSection() {
  return (
    <section id="hero" className={styles.hero} data-home-region aria-labelledby="hero-title">
      <div className={styles.heroRibbon} aria-hidden="true" />
      <div className={styles.heroContent}>
        <p className={styles.badge}><span aria-hidden="true" />The Transparent Talent &amp; Delivery Ecosystem by eQOURSE · Singapore &amp; India · ISO 9001 and ISO/IEC 27001 certified</p>
        <h1 id="hero-title" className={styles.heroTitle}>
          Join the expert network powering AI and world-class content.
        </h1>
        <p className={styles.heroCopy}>
          Work from anywhere on projects that shape next generation intelligence. Whether you are a specialist, an agency or an enterprise, eQOURSE+ delivers operational clarity built on more than 20 years of expertise.
        </p>
        <div className={styles.heroActions}>
          <Link className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/freelancer">
            <span className="eq-glass-button__label">Apply as an Expert </span><span aria-hidden="true">→</span>
          </Link>
          <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/vendor">
            <span className="eq-glass-button__label">Join as an Vendor Agency</span>
          </Link>
          <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/client">
            <span className="eq-glass-button__label">Deploy Expert Teams</span>
          </Link>
          {/* <Link className="home-login-link" href="/login">Already registered? Log in</Link> */}
        </div>
        <p className={styles.trustLine}>
          100% REMOTE FLEXIBILITY <span>·</span> MILESTONE-BASED PAY, ON RECORD <span>·</span> ENTERPRISE WORK ORDERS <span>·</span> AUDITED QUALITY STANDARDS
        </p>

      </div>
      <CockpitPreview />

    </section>
  );
}
