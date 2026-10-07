import type { Metadata } from "next";
import { HomeFooter, HomeHeader } from "../components/home/HomeChrome";
import { Faq, FinalCta } from "../components/landing/faq-cta";
import { Hero } from "../components/landing/hero";
import { MotionRuntime } from "../components/landing/motion-runtime";
import { Pillars } from "../components/landing/pillars";
import { GlassBoxSection, HowItWorks } from "../components/landing/sections";
import { Trust } from "../components/landing/trust";
import "../components/landing/sections.css";
import "../components/landing/cockpit.css";
import { serializeJsonLd } from "../lib/json-ld";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  structuredData,
} from "./home-data";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
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
    <main className="lx lx-home">
      <MotionRuntime />
      <HomeHeader />
      <Hero />
      <Pillars />
      <HowItWorks />
      <GlassBoxSection />
      <Trust />
      <Faq />
      <FinalCta />
      <HomeFooter />
      {structuredData.map((block) => (
        <script
          key={block["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </main>
  );
}
