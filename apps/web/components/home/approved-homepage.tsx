import Image from "next/image";
import { approvedHome } from "../../content/approved-home";
import { serializeJsonLd } from "../../lib/json-ld";
import { PublicThemeToggle } from "../public/public-client-islands";
import { AudienceSelector, LiquidArtwork, SpecializationTracks } from "./home-materials";
import styles from "./approved-homepage.module.css";

const heading = (s: string) => s.replace("Section Header (H2): ", "");
const ctaName = (s: string) => s.match(/\[ (.*?) \]/)?.[1] ?? s;
const routes = ["/register/freelancer", "/register/vendor", "/register/client"];
const nav = [["Platform", "/#ecosystem"], ["Experts", "/freelancers"], ["Vendors", "/vendors"], ["About eQOURSE+", "/about"]] as const;
const footerGroups = [
  ["Platform", ["About eQOURSE+", "/about"], ["How It Works", "/#how-it-works"], ["Glass Box Architecture", "/#glass-box"], ["Quality and Rigor", "/#trust"], ["Trust and Provenance", "/#trust"], ["FAQ", "/#faq"]],
  ["Experts", ["Join as a Specialist", "/register/freelancer"], ["Specialist Pathways", "/freelancers"], ["Verification and Calibration", "/freelancers"], ["Domains and Expertise", "/#categories"], ["Earnings and Clarity", "/freelancers"]],
  ["Vendors", ["Join as a Vendor", "/register/vendor"], ["Vendor Network", "/vendors"], ["Onboarding and Capability", "/vendors"], ["Structured Delivery", "/vendors"], ["Agency Partnership", "/vendors"]],
] as const;

export const approvedFaqSchema = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: Array.from({ length: 7 }, (_, index) => ({ "@type": "Question", name: approvedHome.faq[1 + index * 2], acceptedAnswer: { "@type": "Answer", text: approvedHome.faq[2 + index * 2] } })),
};

function Brand() {
  return <a className={styles.brand} href="/" aria-label="eQOURSE+"><Image src="/Artboard 5.svg" alt="eQOURSE" width={145} height={54} priority /><span aria-hidden="true">+</span></a>;
}

export function ApprovedHomepage() {
  return <>
    <header className={styles.headerWrap}><nav id="site-navigation" className={styles.header} aria-label="Primary navigation" data-home-region aria-labelledby="site-navigation-title">
      <span id="site-navigation-title" className="sr-only">Primary navigation</span><Brand />
      <div className={styles.navLinks}>{nav.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</div>
      <div className={styles.headerActions}><PublicThemeToggle /><a className={styles.loginLink} href="/login">Login</a><a className={styles.accessLink} href="/register/freelancer">Apply as an Expert <span aria-hidden="true">↗</span></a></div>
      <details className={styles.mobileMenu}><summary aria-label="Navigation menu"><span aria-hidden="true">☰</span></summary><div>{nav.map(([label, href]) => <a key={label} href={href}>{label}</a>)}<a href="/login">Login</a><a href="/register/freelancer">Apply as an Expert</a></div></details>
    </nav></header>
    <section id="hero" className={styles.hero} data-home-region aria-labelledby="hero-title">
      <div className={styles.heroAmbient} aria-hidden="true"><span /><span /></div>
      <div className={styles.heroInner}>
        <p className={styles.trustBadge}><span aria-hidden="true" />{approvedHome.badge}</p>
        <div className={styles.heroLayout}><div className={styles.heroCopy}>
          <h1 id="hero-title">Partner for{" "}<br /><span>World-Class AI</span>{" "}<br />and Content</h1>
          <p className={styles.heroDescription}>{approvedHome.subheadline}</p><AudienceSelector />
        </div><LiquidArtwork /></div>
      </div>
    </section>
    <section className={styles.proofBanner} aria-labelledby="proof-banner-title"><h2 className="sr-only" id="proof-banner-title">Trust &amp; Proof</h2>{approvedHome.proof.map(line => <div key={line}><h3>{line.split(": ")[0]}</h3><p>{line.split(": ").slice(1).join(": ")}</p></div>)}</section>
    <section id="ecosystem" className={styles.ecosystem} data-home-region aria-labelledby="ecosystem-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>The 3-Sided Ecosystem</p><h2 id="ecosystem-title">{approvedHome.ecosystemHeading}</h2></div>
      <div id="how-it-works" className={styles.pillars}>{approvedHome.pillars.map((pillar, index) => <article className={styles.pillar} key={pillar[0]}>
        <div className={styles.pillarIntro}><p className={styles.eyebrow}>{approvedHome.pillarLabels[index]}</p><h3>{pillar[0].replace("Headline (H3): ", "")}</h3><a className={styles.primaryButton} href={routes[index]}>{ctaName(pillar[pillar.length - 1] ?? "")}<span aria-hidden="true">↗</span></a></div>
        <div className={styles.pillarDetails}>{pillar.slice(1, -1).map((line, lineIndex) => <p key={line}><span className={styles.detailMark} aria-hidden="true">{["⌖", "◎", "↗", "+"][lineIndex]}</span><span><strong>{line.split(": ")[0]}:</strong>{" "}{line.split(": ").slice(1).join(": ")}</span></p>)}</div>
      </article>)}</div>
    </section>
    <section id="categories" className={styles.specializations} data-home-region aria-labelledby="categories-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>Specialization Tracks</p><h2 id="categories-title">{heading(approvedHome.tracks[0])}</h2></div><SpecializationTracks /></section>
    <section id="glass-box" className={styles.glassBox} data-home-region aria-labelledby="glass-box-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>The Glass Box Advantage</p><h2 id="glass-box-title">{heading(approvedHome.comparison[0])}</h2></div>
      <div className={styles.comparison}><div className={styles.comparisonHeader}><span>{approvedHome.comparison[1]}</span><span>{approvedHome.comparison[2]}</span><strong>{approvedHome.comparison[3]}</strong></div>{Array.from({ length: 5 }, (_, index) => <div className={styles.comparisonRow} key={index}><h3>{approvedHome.comparison[4 + index * 3]}</h3><p className={styles.legacy}>{approvedHome.comparison[5 + index * 3]}</p><p className={styles.standard}><span aria-hidden="true">✓</span>{approvedHome.comparison[6 + index * 3]}</p></div>)}</div>
    </section>
    <section id="trust" className={styles.governance} data-home-region aria-labelledby="trust-title"><div className={styles.governanceIntro}><p className={styles.eyebrow}>Trust, Security &amp; Global Infrastructure</p><h2 id="trust-title">{heading(approvedHome.governance[0])}</h2><div className={styles.certificationSeal} aria-hidden="true"><span>ISO</span><i /><span>9001<br />27001</span></div></div><div className={styles.governanceList}>{approvedHome.governance.slice(1).map(line => <div key={line}><h3>{line.split(": ")[0]}</h3><p>{line.split(": ").slice(1).join(": ")}</p></div>)}</div></section>
    <section id="faq" className={styles.faq} data-home-region aria-labelledby="faq-title"><div className={styles.sectionHeading}><h2 id="faq-title">Frequently Asked Questions</h2></div><div className={styles.faqList}>{approvedFaqSchema.mainEntity.map(item => <details key={item.name}><summary>{item.name}</summary><p>{item.acceptedAnswer.text}</p></details>)}</div></section>
    <section id="final-cta" className={styles.closing} data-home-region aria-labelledby="final-cta-title"><div className={styles.closingHalo} aria-hidden="true" /><h2 id="final-cta-title">{heading(approvedHome.closing[0])}</h2><p>{approvedHome.closing[1].replace("Subtext: ", "")}</p><div className={styles.closingActions}>{approvedHome.closing.slice(3).map((line, index) => <a className={index === 0 ? styles.primaryButton : styles.secondaryButton} href={routes[index]} key={line}>{ctaName(line)}<span aria-hidden="true">↗</span><small>{line.match(/\((.*?)\)/)?.[1]}</small></a>)}</div></section>
    <footer id="site-footer" className={styles.footer} data-home-region aria-labelledby="footer-title"><h2 id="footer-title" className="sr-only">eQOURSE+ — the talent platform by eQOURSE</h2><div className={styles.footerTop}><Brand /><p>eQOURSE+ is an enterprise division of eQOURSE. Certified ISO 9001:2015 &amp; ISO 27001:2013. Operating across Singapore &amp; India.</p><a className={styles.textLink} href="https://www.eqourse.com/" aria-label="Visit eQOURSE">Visit eQOURSE <span aria-hidden="true">↗</span></a></div><div className={styles.footerGrid}>{footerGroups.map(([title, ...links]) => <div key={title}><h3>{title}</h3>{links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</div>)}<div><h3>Legal</h3>{["Privacy Policy", "Terms of Service", "Cookie Policy", "Data Protection", "Acceptable Use Policy"].map(label => <span key={label}>{label}</span>)}</div></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(approvedFaqSchema) }} />
  </>;
}

