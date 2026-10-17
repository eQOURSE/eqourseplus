/**
 * The three eQOURSE+ audiences. Hero, header menu, FAQ and footer CTAs read
 * from this list so labels and destinations never drift between pages.
 * Sections with their own approved wording (pillars, final CTA) keep the
 * same destinations via `href`.
 */
export type SegmentId = "expert" | "vendor" | "enterprise";

export interface Segment {
  id: SegmentId;
  /** Who the path is for, as shown on the hero call-to-action bar. */
  audience: string;
  cta: string;
  /** Short qualifier shown with the CTA, when there is one. */
  note?: string;
  href: string;
  learnMore: string;
  learnMoreHref: string;
}

export const SEGMENTS: readonly Segment[] = [
  {
    id: "expert",
    audience: "For Freelance Experts",
    cta: "Apply as an Expert",
    note: "Work Remotely",
    href: "/register/freelancer",
    learnMore: "More for freelancers",
    learnMoreHref: "/freelancers",
  },
  {
    id: "vendor",
    audience: "For Vendor Agencies",
    cta: "Join as an Agency Partner",
    href: "/register/vendor",
    learnMore: "More for vendors",
    learnMoreHref: "/vendors",
  },
  {
    id: "enterprise",
    audience: "For Enterprise Clients",
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
