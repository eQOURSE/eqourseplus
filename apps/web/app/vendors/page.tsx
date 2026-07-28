import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../components/public/site-chrome";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import { serializeJsonLd } from "../../lib/json-ld";
import {
  capabilityRequirements,
  rfpModel,
  vendorFaq,
  vendorJourney,
  vendorStructuredData,
  VENDORS_DESCRIPTION,
  VENDORS_TITLE,
} from "./vendors-data";

export const metadata: Metadata = {
  title: VENDORS_TITLE,
  description: VENDORS_DESCRIPTION,
  alternates: {
    canonical: "/vendors",
    languages: {
      en: "/vendors",
      "x-default": "/vendors",
    },
  },
  openGraph: {
    type: "website",
    url: "/vendors",
    title: VENDORS_TITLE,
    description: VENDORS_DESCRIPTION,
    siteName: "eQOURSE+",
    locale: "en",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: VENDORS_TITLE,
    description: VENDORS_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
};

export default function VendorsPage() {
  return (
    <main id="top" className="home-shell vendor-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="vendors" />

      <section className="freelancer-hero" aria-labelledby="vendor-title">
        <div className="freelancer-hero-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">For vendor agencies</p>
          <h1 id="vendor-title">
            Bring proven capabilities to structured project delivery.
          </h1>
          <p className="freelancer-hero-copy">
            This page outlines the planned vendor model: company verification,
            capability review, sealed RFPs, team allocation, delivery, and
            milestone invoicing.
          </p>
          <div className="home-hero-actions">
            <a
              className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#how-it-works"
            >
              <span className="eq-glass-button__label">
                See how agencies work
              </span>
              <ArrowMark />
            </a>
            <a
              className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#faq"
            >
              <span className="eq-glass-button__label">
                Read the vendor FAQ
              </span>
            </a>
          </div>
          <p className="freelancer-hero-aside">
            Verification
            <span aria-hidden="true" />
            Capabilities
            <span aria-hidden="true" />
            RFPs
            <span aria-hidden="true" />
            Delivery
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        className="freelancer-section freelancer-journey"
        aria-labelledby="vendor-journey-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading home-section-heading--split">
            <div>
              <p className="home-eyebrow">The vendor path</p>
              <h2 id="vendor-journey-title" className="home-section-title">
                How agencies work with eQOURSE+
              </h2>
            </div>
            <p>
              The normative vendor flow reaches member allocation. Delivery
              and invoicing continue through the documented project and finance
              flows.
            </p>
          </div>
          <ol className="freelancer-journey-list">
            {vendorJourney.map((step) => (
              <li key={step.title} data-testid="vendor-step">
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="freelancer-section freelancer-proof"
        aria-labelledby="capability-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Capability requirements</p>
            <h2 id="capability-title" className="home-section-title">
              What an agency prepares for verification
            </h2>
            <p className="freelancer-section-intro">
              Capability review combines company evidence, signatory checks,
              team readiness, and a tax profile before bidding.
            </p>
          </div>
          <div className="freelancer-detail-list">
            {capabilityRequirements.map((requirement) => (
              <article key={requirement.title}>
                <h3>{requirement.title}</h3>
                <p>{requirement.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="freelancer-section freelancer-payout"
        aria-labelledby="rfp-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">The RFP model</p>
            <h2 id="rfp-title" className="home-section-title">
              How vendor RFPs work
            </h2>
            <p className="freelancer-section-intro">
              Vendor RFPs belong to a later platform phase. This page explains
              the model; it does not announce live bidding.
            </p>
          </div>
          <div className="freelancer-detail-list">
            {rfpModel.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="freelancer-section freelancer-proof"
        aria-labelledby="case-studies-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Proven delivery</p>
            <h2 id="case-studies-title" className="home-section-title">
              Review eQOURSE case studies at the source
            </h2>
            <p className="freelancer-section-intro">
              Explore content-services and AI-data work documented by eQOURSE
              without restating its reported outcomes here.
            </p>
          </div>
          <a
            className="home-freelancer-link"
            href="https://www.eqourse.com/casestudy"
          >
            Explore eQOURSE case studies
            <ArrowMark />
          </a>
        </div>
      </section>

      <section
        id="faq"
        className="freelancer-section vendor-faq"
        aria-labelledby="vendor-faq-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Vendor FAQ</p>
            <h2 id="vendor-faq-title" className="home-section-title">
              What agencies should expect
            </h2>
          </div>
          <div className="vendor-faq-list">
            {vendorFaq.map((item) => (
              <details key={item.question}>
                <summary>
                  <h3>{item.question}</h3>
                </summary>
                <p data-faq-answer>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      {vendorStructuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </main>
  );
}
