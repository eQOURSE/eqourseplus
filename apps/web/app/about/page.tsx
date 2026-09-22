import type { Metadata } from "next";
import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import { ArrowMark } from "../../components/public/site-chrome";
import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import { serializeJsonLd } from "../../lib/json-ld";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import { ABOUT_DESCRIPTION, ABOUT_TITLE, aboutStructuredData, expertiseDomains, faqs } from "./about-data";

export const metadata: Metadata = {
  title: ABOUT_TITLE, description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about", languages: { en: "/about", "x-default": "/about" } },
  openGraph: { type: "website", url: "/about", title: ABOUT_TITLE, description: ABOUT_DESCRIPTION, siteName: "eQOURSE+", locale: "en", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }] },
  twitter: { card: "summary_large_image", title: ABOUT_TITLE, description: ABOUT_DESCRIPTION, images: [{ url: "/opengraph-image", alt: SOCIAL_IMAGE_ALT }] },
};

const buttonClass = "eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta";

export default function AboutPage() {
  return (
    <main id="top" className="home-shell about-shell">
      <PublicAmbientCanvas /><HomeHeader brandHref="/" activePage="about" />
      <section className="freelancer-hero about-hero" aria-labelledby="about-title">
        {/* <div className="freelancer-hero-field" aria-hidden="true"><span /><span /><span /></div> */}
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">About eQOURSE+</p>
          <h1 id="about-title"><span>A Verified Talent Network for AI</span><span>Data and Content Projects</span></h1>
          <p className="freelancer-hero-copy">Connecting companies with verified specialists and vetted vendor agencies through structured verification, skill testing, matching and quality-led delivery.</p>
          <div className="home-hero-actions">
            <a className={buttonClass} href="/freelancers"><span className="eq-glass-button__label">Explore Our Network</span><ArrowMark /></a>
            <a className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta" href="#how-it-works"><span className="eq-glass-button__label">How eQOURSE+ Works</span><ArrowMark /></a>
          </div>
          <div className="about-showcase" aria-hidden="true">
            {/* Reference-only showcase artwork supplied with the design. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBaeXHS35bLld5RkqxK_DyHm9SVY1KtrVr5_M0MHNQ0nxI10zpDj8smtJlMbIVN1JTo445KbEZ61kUPgeyP8B-Vn-fJvnS2pOQvxU31nyXwCVgt9iq39MI7y7K51lH6wd4R_vJcsnBvlfAuEJSqllz0wU2EZ9IL4wvLh3mmBCkCqOM13zLSXwYnK9qd3OlHbR4aDmEFYfmS2AeRbHl3oeDMC6N4XLWcPg_01Kovq2fTbykB1RFMdAcOQ" alt="" />
            <div className="about-showcase-grid" />
            <span className="about-showcase-label about-showcase-label--left">VERIFIED TALENT GRID</span>
            <span className="about-showcase-label about-showcase-label--right">QUALITY-LED DELIVERY</span>
            {/* <div className="about-showcase-core"></div> */}
          </div>
        </div>
      </section>

      <section className="freelancer-section about-copy-section" aria-labelledby="who-title"><div className="home-section-inner about-panel-section"><p className="home-eyebrow">Who We Are</p><h2 id="who-title" className="home-section-title">Built for Specialist Work That Requires Proof, Quality and Accountability</h2><p>eQOURSE+ is the verified talent and vendor network by eQOURSE. It connects project teams with qualified specialists and agencies across AI data, multilingual content and expert-led project delivery.</p><p>The platform brings verification, skill testing, project matching and quality-led workflows into one structured environment. Companies gain access to KYC-verified specialists and accredited vendor agencies. Specialists and vendor teams gain clear processes, transparent standards and accountable project pathways.</p><p>eQOURSE+ supports AI training data, annotation, evaluation, multilingual content and specialist delivery for organisations that value precision, provenance and institutional rigour. It operates under dual Singapore and India governance with ISO-aligned standards, creating a transparent and elevated foundation for global projects.</p></div></section>

      <section className="freelancer-section about-copy-section about-sunken" aria-labelledby="why-title"><div className="home-section-inner"><div className="about-centered-heading"><p className="home-eyebrow">Why We Built eQOURSE+</p><h2 id="why-title" className="home-section-title">Why We Built eQOURSE+</h2><p>Sourcing specialist talent is rarely one problem. It is six, and they compound:</p></div><ul className="about-problem-list"><li><strong>Identity is asserted rather than proven.</strong></li><li><strong>Capability is described rather than demonstrated.</strong></li><li><strong>Vendor information is scattered</strong> across email threads, spreadsheets and attachments.</li><li><strong>Quality history disappears</strong> the moment a project closes.</li><li><strong>Matching is manual,</strong> so it scales with headcount rather than with demand.</li><li><strong>Delivery, review and payment run in disconnected systems.</strong></li></ul><div className="about-panel-section"><p>Each is survivable on its own. Together they produce the outcome every project team recognises: work that has to be checked twice, contributors who cannot be traced back to a credential, and a quality record that exists only in someone&apos;s memory.</p><p>eQOURSE+ connects those six stages into one verified workflow. Identity is verified before a specialist enters the pool. Capability is tested rather than claimed. Vendor agencies onboard through a single accredited process. Matching draws on verified capability rather than recollection. And delivery, review and settlement run in one place, with a visible trail from assignment to payment.</p></div></div></section>

      <section className="freelancer-section" aria-labelledby="expertise-title"><div className="home-section-inner"><p className="home-eyebrow">Our Expertise</p><h2 id="expertise-title" className="home-section-title">Expertise Across AI Data, Content and Specialist Delivery</h2><div className="about-domain-grid">{expertiseDomains.map(([title, copy]) => <article className="about-domain-card" key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

      <section id="how-it-works" className="freelancer-section about-sunken" aria-labelledby="how-title"><div className="home-section-inner"><p className="home-eyebrow">How eQOURSE+ Works</p><h2 id="how-title" className="home-section-title">From Verification to Accountable Project Delivery</h2><div className="about-process-grid">{[["Verify", "Identity and organisation verification for specialists and vendor agencies."], ["Test", "Skill and capability assessment through structured evaluation."], ["Match", "Talent and vendor matching based on project requirements and verified capabilities."], ["Deliver", "Structured delivery, quality review and finance workflow with clear visibility."]].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div><div className="about-inline-links"><a href="/freelancers">More for specialists <ArrowMark /></a><a href="/vendors">More for vendor agencies <ArrowMark /></a></div></div></section>

      <section className="freelancer-section" aria-labelledby="proof-title"><div className="home-section-inner"><p className="home-eyebrow">Proof and Trust</p><h2 id="proof-title" className="home-section-title">A Foundation Built for Quality and Scale</h2><dl className="about-proof-grid">{[["500+", "Specialists"], ["30+", "Languages"], ["ISO 9001", "Quality Management"], ["ISO/IEC 27001", "Information Security"], ["India and Singapore", "Operational Presence"]].map(([value, label]) => <div key={value}><dt>{value}</dt><dd>{label}</dd></div>)}</dl><p className="about-qualifier">Specialist network and delivery capability across the eQOURSE group.</p></div></section>

      <section className="freelancer-section about-sunken" aria-labelledby="story-title"><div className="home-section-inner"><p className="home-eyebrow">Our Story</p><h2 id="story-title" className="home-section-title">From Content Expertise to a Verified Talent Ecosystem</h2><ol className="about-story-list"><li><strong>2020</strong><span>eQOURSE founded</span></li><li><span>Content and multilingual delivery expanded</span></li><li><span>AI data services introduced</span></li><li><span>Global operations and ISO standards established</span></li><li><span>India and Singapore operations strengthened</span></li><li><span>eQOURSE+ developed as the verified talent and vendor network</span></li></ol><p>The journey reflects a steady move from specialist content delivery into a structured platform that supports AI data, content and expert-led projects, with verification, quality and accountability at every stage.</p></div></section>

      <section className="freelancer-section" aria-labelledby="ecosystem-title"><div className="home-section-inner"><p className="home-eyebrow">Part of the eQOURSE Ecosystem</p><h2 id="ecosystem-title" className="home-section-title">Part of the eQOURSE Ecosystem</h2><div className="about-ecosystem-grid"><p><strong>eQOURSE</strong><span>AI data and content services</span></p><p><strong>eQOURSE+</strong><span>Verified specialist and vendor network</span></p><p><strong>TUTRAIN</strong><span>Tutoring and education services</span></p></div><p>Each brand serves a clear role within the same institutional ecosystem, allowing organisations and specialists to engage with the right pathway for their needs.</p></div></section>

      <section className="freelancer-section about-faq" aria-labelledby="faq-title"><div className="home-section-inner"><p className="home-eyebrow">Frequently Asked Questions</p><h2 id="faq-title" className="home-section-title">Frequently Asked Questions</h2><div className="about-faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span><i aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="freelancer-section about-closing" aria-labelledby="closing-title"><div className="home-section-inner about-contact-inner"><div><p className="home-eyebrow">Closing Call to Action</p><h2 id="closing-title" className="home-section-title">Build Your Next Project With Verified Expertise</h2><p>Whether you need AI data specialists, content experts or structured vendor delivery, eQOURSE+ provides a transparent and elevated environment for work that requires precision and accountability.</p></div><div className="about-cta-stack">
        <a className={buttonClass} href="/register/client"><span className="eq-glass-button__label">Hire Experts</span><ArrowMark /></a>
        <a className={buttonClass} href="/register/freelancer"><span className="eq-glass-button__label">Join as an Expert</span><ArrowMark /></a>
        <a className={buttonClass} href="/register/vendor"><span className="eq-glass-button__label">Join as a Vendor</span><ArrowMark /></a>
      </div>
      </div>
      </section>

      <HomeFooter />
      {aboutStructuredData.map((block) => <script key={block["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }} />)}
    </main>
  );
}
