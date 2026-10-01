import {
  parentOrganization,
  PLATFORM_ORGANIZATION_ID,
} from "./site-structured-data";

export const HOME_TITLE = "eQOURSE+ | Expert Network for AI Training & Content";
export const HOME_DESCRIPTION =
  "Remote work on frontier AI and global content projects. Verified specialists, partner agencies and enterprise clients in one transparent, audited ecosystem.";
export const SOCIAL_IMAGE_ALT = "eQOURSE+ brand gradient";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": PLATFORM_ORGANIZATION_ID,
  name: "eQOURSE+",
  url: "https://plus.eqourse.com",
  parentOrganization,
  sameAs: ["https://twitter.com/EQourse"],
  address: [
    {
      "@type": "PostalAddress",
      addressCountry: "India",
    },
    {
      "@type": "PostalAddress",
      addressCountry: "Singapore",
    },
  ],
} as const;

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://plus.eqourse.com/#website",
  name: "eQOURSE+",
  url: "https://plus.eqourse.com",
  publisher: {
    "@id": "https://plus.eqourse.com/#organization",
  },
} as const;

export const structuredData = [organization, website] as const;
