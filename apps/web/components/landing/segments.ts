/**
 * The three eQOURSE+ audiences. Every segment CTA on the public site reads
 * from this list so labels and destinations never drift between pages.
 */
export type SegmentId = "expert" | "vendor" | "enterprise";

export interface Segment {
  id: SegmentId;
  audience: string;
  tagline: string;
  cta: string;
  href: string;
  learnMore: string;
  learnMoreHref: string;
}

export const SEGMENTS: readonly Segment[] = [
  {
    id: "expert",
    audience: "Experts, Freelancers & SMEs",
    tagline: "Work Anywhere, Anytime.",
    cta: "Apply as an Expert",
    href: "/register/freelancer",
    learnMore: "More for freelancers",
    learnMoreHref: "/freelancers",
  },
  {
    id: "vendor",
    audience: "Vendor Agencies",
    tagline: "Big Projects from Frontier Labs.",
    cta: "Join as a Vendor",
    href: "/register/vendor",
    learnMore: "More for vendors",
    learnMoreHref: "/vendors",
  },
  {
    id: "enterprise",
    audience: "Enterprises & AI Labs",
    tagline: "Deploy Verified Domain Authorities.",
    cta: "Deploy Expert Teams",
    href: "/register/client",
    learnMore: "How we work with enterprises",
    learnMoreHref: "/clients",
  },
] as const;

export const LOGIN = { label: "Login", href: "/login" } as const;
export const ACCESS = { label: "Access eQOURSE+", href: "/register" } as const;

export function segment(id: SegmentId): Segment {
  const found = SEGMENTS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown segment ${id}`);
  return found;
}
