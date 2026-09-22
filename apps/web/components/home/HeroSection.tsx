import Link from "next/link";

import styles from "./home-redesign.module.css";


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
          Work from anywhere, anytime on projects shaping next-generation intelligence. Whether you are an independent specialist seeking fair pay, an agency scaling high-volume pipelines, or an enterprise demanding total workflow observability and quality — eQOURSE+ replaces the industry&apos;s black box with operational clarity.
        </p>
        <div className={styles.heroActions}>
          <Link className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/freelancer">
            <span className="eq-glass-button__label">Apply as an Expert (Work Remotely)</span><span aria-hidden="true">→</span>
          </Link>
          <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/vendor">
            <span className="eq-glass-button__label">Join as an Agency Partner</span>
          </Link>
          <Link className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="/register/client">
            <span className="eq-glass-button__label">Deploy Expert Teams</span>
          </Link>
          <Link className="home-login-link" href="/login">Already registered? Log in</Link>
        </div>
        <p className={styles.trustLine}>
          100% REMOTE FLEXIBILITY <span>·</span> MILESTONE-BASED PAY, ON RECORD <span>·</span> ENTERPRISE WORK ORDERS <span>·</span> AUDITED QUALITY STANDARDS
        </p>
        {/* <PersonaSwitcher /> */}
      </div>
      <CockpitPreview />  
    </section>
  );
}

function CockpitPreview() {
  const bars = [42, 66, 82, 94, 78, 48, 56];
  return (
    <div className={`cockpit ${styles.cockpit} eq-glass-stage`} aria-label="Workspace interface preview">
      <div aria-hidden="true" className="eq-glass-substrate" />
      <div className={`${styles.browserBar} eq-glass-surface eq-glass-tier-regular`}>
        <div className={styles.windowDots} aria-hidden="true"><span /><span /><span /></div>
        <code>plus.eqourse.com/live-cockpit/project-orion</code>
        <span className={styles.cockpitTools}>⌕ &nbsp; ⌘K &nbsp; ● &nbsp; Workspace preview</span>
      </div>
      <div className={`${styles.cockpitHeader} eq-frosted eq-frosted--card`}>
        <div><strong>Client dashboard preview</strong>    <small>Interface example — not live data</small></div>
        <div className={styles.liveActions}><span>● PREVIEW</span><button type="button" className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular">View workspace</button></div>
      </div>
      <div className={`${styles.metrics} eq-frosted eq-frosted--card`}>
        {["Active Specialists", "Active Vendor Teams", "First Pass Yield", "Deliverables YTD"].map((label) => (
          <div key={label}><small>{label}</small><p><strong>Preview</strong><em>Interface</em></p></div>
        ))}
      </div>
      <div className={`${styles.telemetryGrid} eq-glass-surface eq-glass-tier-regular`}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeading}><strong>Illustrative throughput layout</strong><span>Interface preview</span></div>
          <div className={styles.chart} aria-label="Illustrative throughput bars">
            {bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
        </div>
        <div className={styles.qualityCard}>
          <strong>QUALITY INDICATORS</strong>
          <dl>
            <div><dt>Golden Match</dt><dd>Preview</dd></div>
            <div><dt>Avg. Confidence</dt><dd>Preview</dd></div>
            <div><dt>Escalation Rate</dt><dd>Preview</dd></div>
            <div><dt>SLA Compliance</dt><dd>Preview</dd></div>
          </dl>
          <p className={styles.cockpitFoot}><span>All systems</span><b>Operational</b></p>
        </div>
      </div>
    </div>
  );
}
