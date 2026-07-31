import {
  certifications,
  PARENT_ORGANIZATION_ID,
  PLATFORM_ORGANIZATION_ID,
} from "../site-structured-data";

export const ABOUT_TITLE =
  "ISO-Certified AI Data & Content Talent | eQOURSE+";

export const ABOUT_DESCRIPTION =
  "Meet eQOURSE+, the talent platform by eQOURSE: 500+ specialists, 30+ languages, ISO 9001 and ISO 27001, with operations in India and Singapore.";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": PLATFORM_ORGANIZATION_ID,
  parentOrganization: {
    "@id": PARENT_ORGANIZATION_ID,
  },
  hasCertification: certifications,
} as const;

const breadcrumbList = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://plus.eqourse.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: "https://plus.eqourse.com/about",
    },
  ],
} as const;

export const aboutStructuredData = [organization, breadcrumbList] as const;
