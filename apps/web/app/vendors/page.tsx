import type { Metadata } from "next";
import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import { ArrowMark } from "../../components/public/site-chrome";
import { serializeJsonLd } from "../../lib/json-ld";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import { capabilityRequirements, rfpModel, vendorFaq, vendorJourney, vendorStructuredData, VENDORS_DESCRIPTION, VENDORS_TITLE } from "./vendors-data";
import styles from "./vendors-page.module.css";

export const metadata: Metadata = {
  title: VENDORS_TITLE,
  description: VENDORS_DESCRIPTION,
  alternates: { canonical: "/vendors", languages: { en: "/vendors", "x-default": "/vendors" } },
  openGraph: { type: "website", url: "/vendors", title: VENDORS_TITLE, description: VENDORS_DESCRIPTION, siteName: "eQOURSE+", locale: "en", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }] },
  twitter: { card: "summary_large_image", title: VENDORS_TITLE, description: VENDORS_DESCRIPTION, images: [{ url: "/opengraph-image", alt: SOCIAL_IMAGE_ALT }] },
};

const timelineIcons = ["▤", "▣", "♙", "◫", "●", "♧", "▣", "◇", "⌁", "◎", "▤"];

function AgencyIllustration() {
 return <div className={styles.illustration} aria-label="Agency portfolio and milestone preview"><div className={styles.rfpBack}>▣ Sealed RFP bid <span>ENCRYPTED</span><i /><i /></div><div className={styles.agencyCard}><div><b>AP</b><strong>Agency Portfolio<small>Institutional agency ID</small></strong><em>● Active</em></div><div className={styles.agencyChecks}><span>♙<small>KYB Verified</small></span><span>⌁<small>Signatory KYC</small></span><span>▤<small>MSA Signed</small></span></div></div><div className={styles.milestone}><strong>● Milestone // QA Gate Passed</strong><b>Ready</b><div><i /></div><small>▣ Escrow locked <em>Ready for PM signoff</em></small></div></div>;
}

export default function VendorsPage() {
  return <main id="top" className={styles.page}><HomeHeader brandHref="/" activePage="vendors" />
    <div className={styles.body}>
      <section className={styles.hero} aria-labelledby="vendor-title"><div className={styles.heroCopy}><p className={styles.eyebrow}>● FOR VENDOR AGENCIES</p><h1 id="vendor-title">Bring proven capabilities to structured project delivery.</h1><p>Verification, capability review, sealed RFPs, delivery and milestone invoicing. One structured path.</p><div className={styles.actions}><a className={styles.primaryButton} href="#vendor-path">Register your agency <span>→</span></a><a className={styles.secondaryButton} href="#vendor-path">See how agencies work</a><a className={styles.textLink} href="#faq">Read the vendor FAQ ↓</a></div><div className={styles.process}><span>◉ Verification</span><span>◉ Capabilities</span><span>◉ RFPs</span><span>◉ Delivery</span></div></div><AgencyIllustration /></section>
      <section id="vendor-path" className={styles.timelineSection} aria-labelledby="vendor-journey-title"><div className={styles.sectionHeading}><span className={styles.chip}>SEQUENTIAL PROCESS</span><h2 id="vendor-journey-title">How agencies work with eQOURSE+</h2><p>From registration to milestone invoicing, in eleven steps.</p></div><div className={styles.timeline}>{vendorJourney.map((step, index) => <article className={`${styles.timelineItem} ${index % 2 ? styles.right : styles.left}`} data-testid="vendor-step" key={step.title}><span className={styles.timelineIcon}>{timelineIcons[index]}</span><div><small>Step</small><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div></section>
      <section className={styles.dossier} aria-labelledby="capability-title"><div className={styles.sectionHeadingLeft}><span className={styles.chip}>REQUIRED DOSSIER</span><span className={styles.srOnly}>Capability requirements</span><h2 id="capability-title">What an agency prepares for verification</h2><p>Company evidence, signatory checks, team readiness and a tax profile, before bidding.</p></div><div className={styles.dossierGrid}>{capabilityRequirements.map((item, index) => <article className={index === 0 ? styles.wideCard : ""} key={item.title}><span className={styles.cardIcon}>{["▣", "♙", "♧", "♙", "▤"][index]}</span><h3>{item.title}</h3><p>{item.body}</p><div className={styles.tags}>{[index === 0 ? "GST" : index === 1 ? "KYC" : index === 2 ? "AI Data" : index === 3 ? "Member verified" : "Residency", index === 0 ? "Udyam" : index === 1 ? "Ownership declaration" : index === 2 ? "Annotation" : index === 3 ? "Member ready" : "Tax ID reference", index === 0 ? "Company PAN" : index === 1 ? "MSA e-sign" : index === 2 ? "Multilingual" : index === 4 ? "Withholding rule" : "Documented for verifier review before bidding."].map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}</div></section>
      <section className={styles.rfpSection} aria-labelledby="rfp-title"><div className={styles.rfpCard}><div><span className={styles.chip}>ENTERPRISE REFERENCE</span><h2 id="rfp-title">Review eQOURSE case studies at the source</h2><p>Content services and AI-data work, documented by eQOURSE.</p><a className={styles.caseLink} href="https://www.eqourse.com/casestudy">Explore eQOURSE case studies <ArrowMark /></a></div><div className={styles.placeholderGrid}><span>▤<b>Content services</b><small>DOSSIER MODULE</small></span><span>▦<b>AI data</b><small>DATASET PIPELINE</small></span></div></div><div className={styles.rfpModel}><h2>How vendor RFPs work</h2><p>Vendor RFPs belong to a later platform phase. This page explains the model; it does not announce live bidding.</p>{rfpModel.map((item) => <div key={item.title}><h3>{item.title}</h3><span>{item.body}</span></div>)}</div></section>
      <section id="faq" className={styles.faqSection} aria-labelledby="vendor-faq-title"><div className={styles.sectionHeading}><span className={styles.chip}>CLARIFICATIONS</span><h2 id="vendor-faq-title">What agencies should expect</h2></div><div className={styles.faqList}>{vendorFaq.map((item) => <details key={item.question}><summary><h3>{item.question}</h3><span aria-hidden="true">+</span></summary><p data-faq-answer>{item.answer}</p></details>)}</div></section>
      <section className={styles.finalCta} aria-labelledby="cta-title"><div><h2 id="cta-title">Start with company verification.</h2><p>Structured review, sealed project opportunities, and milestone-based delivery.</p></div><a className={styles.primaryButton} href="#vendor-path">Register your agency <span>→</span></a></section>
    </div>
    <HomeFooter />
    {vendorStructuredData.map((block) => <script key={block["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }} />)}
  </main>;
}
