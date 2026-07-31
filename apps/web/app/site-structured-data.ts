export const PLATFORM_ORGANIZATION_ID =
  "https://plus.eqourse.com/#organization";

export const PARENT_ORGANIZATION_ID =
  "https://www.eqourse.com/#organization";

export const parentOrganization = {
  "@id": PARENT_ORGANIZATION_ID,
  "@type": "Organization",
  name: "eQOURSE",
  url: "https://www.eqourse.com/",
} as const;

export const certifications = [
  {
    "@type": "Certification",
    name: "ISO 9001",
  },
  {
    "@type": "Certification",
    name: "ISO 27001",
  },
] as const;
