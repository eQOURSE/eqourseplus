export const HOME_TITLE = "Verified AI Data & Content Talent | eQOURSE+";
export const HOME_DESCRIPTION =
  "Staff projects with KYC-verified freelancers and vendor agencies across AI data, content and tutoring. ISO 9001 and ISO 27001 certified.";
export const SOCIAL_IMAGE_ALT = "eQOURSE+ brand gradient";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://plus.eqourse.com/#organization",
  name: "eQOURSE+",
  url: "https://plus.eqourse.com",
  parentOrganization: {
    "@type": "Organization",
    name: "EQOURSE ONLINE EDUCATIONERS LLP",
    url: "https://eqourse.com",
  },
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
