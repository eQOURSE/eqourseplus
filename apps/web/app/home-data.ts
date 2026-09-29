import { approvedHome } from "../content/approved-home";
import {
  parentOrganization,
  PLATFORM_ORGANIZATION_ID,
} from "./site-structured-data";

export const HOME_TITLE = approvedHome.title;
export const HOME_DESCRIPTION = approvedHome.description;
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
