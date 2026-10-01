import type { Metadata } from "next";
import { CalloutBanner } from "../components/home/CalloutBanner";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { GlassBoxSection } from "../components/home/GlassBoxSection";
import { HeroSection } from "../components/home/HeroSection";
import { HowItWorksSection } from "../components/home/HowItWorksSection";
import { HomeFaq } from "../components/home/HomeFaq";
import { HomeFooter, HomeHeader } from "../components/home/HomeChrome";
import { TrustSection } from "../components/home/TrustSection";
import styles from "../components/home/home-redesign.module.css";
import { serializeJsonLd } from "../lib/json-ld";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SOCIAL_IMAGE_ALT,
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
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
};

export default function HomePage() {
  return (
    <main className={`home-shell ${styles.page}`}>
      <HomeHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <GlassBoxSection />
      <TrustSection />
      <HomeFaq />
      <CalloutBanner />
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
