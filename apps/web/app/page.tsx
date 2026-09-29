import type { Metadata } from "next";
import { ApprovedHomepage } from "../components/home/approved-homepage";
import styles from "../components/home/approved-homepage.module.css";
import { serializeJsonLd } from "../lib/json-ld";
import { HOME_DESCRIPTION, HOME_TITLE, SOCIAL_IMAGE_ALT, structuredData } from "./home-data";
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
 return <main className={styles.page}><ApprovedHomepage />{structuredData.map(block => <script key={block["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }} />)}</main>;
}
