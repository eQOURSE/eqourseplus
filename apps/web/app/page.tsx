import type { Metadata } from "next";
import { HomeFooter, HomeHeader } from "../components/home/HomeChrome";
import { Faq, FinalCta } from "../components/landing/faq-cta";
import { Hero } from "../components/landing/hero";
import { MotionRuntime } from "../components/landing/motion-runtime";
import { Pillars } from "../components/landing/pillars";
import { DomainStrip, GlassBoxSection, HowItWorks } from "../components/landing/sections";
import { Trust } from "../components/landing/trust";
import "../components/landing/hero.css";
import "../components/landing/board.css";
import "../components/landing/pillars.css";
import "../components/landing/tracks.css";
import "../components/landing/glass-box.css";
import "../components/landing/trust.css";
import "../components/landing/faq-cta.css";
import { serializeJsonLd } from "../lib/json-ld";
import {
  HOME_DESCRIPTION,
  HOME_KEYWORDS,
  HOME_TITLE,
  structuredData,
} from "./home-data";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  keywords: [...HOME_KEYWORDS],
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: "eQOURSE+",
    locale: "en",
    images: [
      {
        url: "/social-preview.png",
        width: 1200,
        height: 630,
        alt: "eQOURSE+ expert network team",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: "/social-preview.png",
        alt: "eQOURSE+ expert network team",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <div className="q q-page q-home">
      <a className="q-skip" href="#main-content">Skip to content</a>
      <MotionRuntime />
      <HomeHeader />
      <main id="main-content">
        <Hero />
        <DomainStrip />
        <Pillars />
        <HowItWorks />
        <GlassBoxSection />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <HomeFooter />
      {structuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </div>
  );
}
