import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../components/public/site-chrome";
import { serializeJsonLd } from "../../lib/json-ld";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import {
  ABOUT_DESCRIPTION,
  ABOUT_TITLE,
  aboutStructuredData,
} from "./about-data";

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: {
    canonical: "/about",
    languages: {
      en: "/about",
      "x-default": "/about",
    },
  },
  openGraph: {
    type: "website",
    url: "/about",
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
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
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <main id="top" className="home-shell about-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="about" />

      <section className="freelancer-hero about-hero" aria-labelledby="about-title">
        <div className="freelancer-hero-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">About eQOURSE+</p>
          <h1 id="about-title">The talent platform by eQOURSE.</h1>
          <p className="freelancer-hero-copy">
            Verified talent for AI data, content and tutoring projects, backed
            by eQOURSE&apos;s service experience and certifications.
          </p>
          <div className="home-hero-actions">
            <a
              className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta"
              href="#services"
            >
              <span className="eq-glass-button__label">
                View services and reach
              </span>
              <ArrowMark />
            </a>
          </div>
          <p className="freelancer-hero-aside">
            AI data
            <span aria-hidden="true" />
            Content
            <span aria-hidden="true" />
            Tutoring
          </p>
        </div>
      </section>

      <section
        id="services"
        className="freelancer-section about-services"
        aria-labelledby="about-services-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading home-section-heading--split">
            <div>
              <p className="home-eyebrow">Services and reach</p>
              <h2 id="about-services-title" className="home-section-title">
                AI data, content and tutoring expertise.
              </h2>
            </div>
            <p>
              eQOURSE provides AI Data Services and Content Services, while
              TUTRAIN provides Tutoring. Operations span India and Singapore.
            </p>
          </div>
          <dl className="about-facts">
            <div>
              <dt>Specialists</dt>
              <dd>500+ specialists</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>30+ languages</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="freelancer-section freelancer-proof"
        aria-labelledby="certifications-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Certifications</p>
            <h2 id="certifications-title" className="home-section-title">
              Quality and information security standards.
            </h2>
          </div>
          <dl className="about-certifications">
            <div>
              <dt>Quality management</dt>
              <dd>ISO 9001</dd>
            </div>
            <div>
              <dt>Information security management</dt>
              <dd>ISO 27001</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="freelancer-section about-security"
        aria-labelledby="security-title"
      >
        <div className="home-section-inner">
          <div className="home-section-heading">
            <p className="home-eyebrow">Platform security</p>
            <h2 id="security-title" className="home-section-title">
              Access controls for the platform.
            </h2>
            <p className="freelancer-section-intro">
              Access is role-based, and authentication endpoints are
              rate-limited.
            </p>
          </div>
        </div>
      </section>

      <section
        className="freelancer-section about-contact"
        aria-labelledby="contact-title"
      >
        <div className="home-section-inner about-contact-inner">
          <div>
            <p className="home-eyebrow">Contact</p>
            <h2 id="contact-title" className="home-section-title">
              Talk to eQOURSE about your project.
            </h2>
          </div>
          <a
            className="eq-glass-button eq-glass-button--primary eq-glass-surface eq-glass-tier-regular home-cta"
            href="https://www.eqourse.com/contact-us"
          >
            <span className="eq-glass-button__label">Contact eQOURSE</span>
            <ArrowMark />
          </a>
        </div>
      </section>

      <SiteFooter />

      {aboutStructuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </main>
  );
}
