import type { Metadata } from "next";
import Link from "next/link";

import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import { serializeJsonLd } from "../../lib/json-ld";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import {
  countryHandling,
  freelancerFaq,
  freelancerJourney,
  freelancerStructuredData,
  FREELANCERS_DESCRIPTION,
  FREELANCERS_TITLE,
  verificationDetails,
} from "./freelancers-data";
import styles from "./freelancers-page.module.css";

export const metadata: Metadata = {
  title: FREELANCERS_TITLE,
  description: FREELANCERS_DESCRIPTION,
  alternates: { canonical: "/freelancers", languages: { en: "/freelancers", "x-default": "/freelancers" } },
  openGraph: { type: "website", url: "/freelancers", title: FREELANCERS_TITLE, description: FREELANCERS_DESCRIPTION, siteName: "eQOURSE+", locale: "en", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }] },
  twitter: { card: "summary_large_image", title: FREELANCERS_TITLE, description: FREELANCERS_DESCRIPTION, images: [{ url: "/opengraph-image", alt: SOCIAL_IMAGE_ALT }] },
};

const journeyKinds = ["verification", "verification", "verification", "testing", "testing", "matching", "delivery", "delivery"];
const journeyIcons = ["♙", "▤", "⌾", "▣", "♜", "↯", "◎", "▣"];

function JourneyTrail() {
  return (
    <div className={styles.journeyTrail} aria-hidden="true">
      <svg viewBox="0 0 1200 3200" preserveAspectRatio="none" role="presentation">
        <defs>
          <linearGradient id="journey-glow" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0C7967" stopOpacity=".85" />
            <stop offset="35%" stopColor="#14B8A6" stopOpacity=".95" />
            <stop offset="70%" stopColor="#3DCBB0" stopOpacity=".75" />
            <stop offset="100%" stopColor="#0C7967" stopOpacity=".9" />
          </linearGradient>
          <filter id="journey-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M 600,180 C 720,280 820,380 780,560 C 740,740 380,820 320,1020 C 260,1220 860,1320 880,1540 C 900,1760 380,1920 420,2140 C 460,2360 760,2500 680,2720 C 620,2900 600,3050 600,3180" filter="url(#journey-bloom)" stroke="url(#journey-glow)" strokeDasharray="8 6" strokeLinecap="round" strokeWidth="3" fill="none" />
      </svg>
    </div>
  );
}

function StatusCard() {
  return (
    <div className={styles.statusCard} aria-label="Verified specialist status preview">
      <div className={styles.statusIdentity}><span className={styles.avatar}>●</span><div><strong>Your name <span className={styles.verified}>●</span></strong><small>Verified Specialist</small></div><span className={styles.tier}>♙<small>Gold Tier</small></span></div>
      {["ID Verified", "Bank Verified", "Agreement Signed"].map((item) => <div className={styles.statusRow} key={item}><span>{item}</span><b>✓</b></div>)}
      <span className={styles.badge}>↻ Category badge</span>
    </div>
  );
}

export default function FreelancersPage() {
  return (
    <main id="top" className={styles.page}>
      <HomeHeader brandHref="/" />
      <div className={styles.content}>
        <JourneyTrail />
      <section className={styles.hero} id="hero" aria-labelledby="freelancer-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>● FOR INDEPENDENT SPECIALISTS</p>
          <h1 id="freelancer-title">Bring your skills to work that values proof and quality.</h1>
          <p>Build a verified profile, prove your skills in proctored tests, and deliver through a QA-led workbench.</p>
          <div className={styles.actions}><Link className={styles.primaryButton} href="/register/freelancer">Create account <span>→</span></Link><a className={styles.secondaryButton} href="#how-it-works">See how it works</a><a className={styles.textLink} href="#faq">Freelancer FAQ ↓</a></div>
          <div className={styles.progress}><span>● Verification</span><span>● Testing</span><span>● Matching</span><span>● Delivery</span></div>
        </div>
        <StatusCard />
      </section>

      <section id="how-it-works" className={styles.section} aria-labelledby="journey-title">
        <div className={styles.sectionHeading}><h2 id="journey-title">Your path through eQOURSE+</h2><p>A clear journey from profile to payout</p></div>
        <ol className={styles.journeyGrid}>{freelancerJourney.map((step, index) => <li data-testid="journey-step" key={step.title}><div className={styles.stepTop}><span className={styles.stepNumber}>{index + 1}</span><span className={styles.stepKind}>{journeyKinds[index]}</span></div><span className={styles.stepIcon}>{journeyIcons[index]}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
      </section>

      <section className={styles.section} aria-labelledby="proof-title">
        <div className={styles.sectionHeading}><h2 id="proof-title">Proof before placement</h2><p>Verification establishes trust. Quality keeps it current.</p></div>
        <div className={styles.proofGrid}>{verificationDetails.map((detail, index) => <article className={`${styles.proofCard} freelancer-proof-card`} key={detail.title}><div className={styles.visualPanel}>{index === 0 && <>{["Government ID", "Selfie liveness", "Address proof"].map((item) => <span key={item}>{item}<b>✓</b></span>)}<small>Bank / e-Sign</small></>}{index === 1 && <><span className={styles.faceBadge}>● Face Presence Active</span><div className={styles.faceBox}>◉<small>ACTIVE</small></div><small>Face presence / Face match / Secure browser</small></>}{index === 2 && <div className={styles.tiers}><span>♙<small>Bronze</small></span><span>♙<small>Silver</small></span><span>♙<small>Gold</small></span></div>}{index === 3 && <div className={styles.qualityLine}><i /><i /><i /></div>}</div><h3>{detail.title}</h3><p>{detail.body}</p></article>)}</div>
      </section>

      <section className={styles.section} aria-labelledby="payout-title"><div className={styles.sectionHeading}><h2 id="payout-title">Getting paid</h2><p>Accepted work, clear records, country-aware handling</p></div><div className={`${styles.ledger} freelancer-ledger`}><strong>Accepted work</strong><span>→ Earnings ledger</span><span>→ Cycle close</span><span className={styles.approved}>→ ◉ Approved payout</span></div><div className={styles.countryGrid}>{countryHandling.map((country) => <article key={country.title}><span className={styles.countryIcon}>⌖</span><div><h3>{country.title}</h3><p>{country.body.replace("India-based talent follows the India contract entity and the applicable TDS and GST workflows.", "India contract entity, TDS and GST workflows.").replace("Talent outside India follows the Singapore contract entity, with residency and tax-profile rules guiding withholding.", "Singapore contract entity, residency and tax-profile rules.")}</p></div></article>)}</div><p className={styles.note}>Payout status and statements are recorded on the platform.</p></section>

      <section id="faq" className={`${styles.section} ${styles.faqSection} freelancer-faq`} aria-labelledby="faq-title"><div className={styles.sectionHeading}><h2 id="faq-title">Freelancer FAQ</h2><p>What to expect</p></div><div className={styles.faqList}>{freelancerFaq.map((item) => <details key={item.question}><summary><h3>{item.question}</h3><span aria-hidden="true">+</span></summary><p data-faq-answer>{item.answer}</p></details>)}</div></section>

      <section className={styles.closing}><h2>Start your verified profile.</h2><Link className={styles.primaryButton} href="/register/freelancer">Create account <span>→</span></Link></section>
      </div>
      <HomeFooter />
      {freelancerStructuredData.map((block) => <script key={block["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }} />)}
    </main>
  );
}
