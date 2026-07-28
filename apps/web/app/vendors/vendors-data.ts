export const VENDORS_TITLE =
  "Vendor Agencies for AI Data & Content | eQOURSE+";
export const VENDORS_DESCRIPTION =
  "Agency verification, capability review, sealed vendor RFPs, team allocation, delivery, and milestone invoicing in the planned eQOURSE+ model.";

export const vendorJourney = [
  {
    title: "Register the agency",
    body: "Create the vendor account that begins the company verification path.",
  },
  {
    title: "Provide KYB documents",
    body: "Submit the company documents required for the vendor's region.",
  },
  {
    title: "Complete signatory checks",
    body: "The authorised signatory completes KYC and the agency completes the MSA.",
  },
  {
    title: "Describe agency capabilities",
    body: "Build the capability profile used in vendor review.",
  },
  {
    title: "Complete review and enter active status",
    body: "A verifier reviews the vendor, and approval moves the vendor into active status.",
  },
  {
    title: "Invite vendor members",
    body: "Invited members complete lighter identity checks and category tests and remain individually tracked under the agency.",
  },
  {
    title: "Respond to a sealed RFP",
    body: "A project manager posts a vendor-only RFP and the agency prepares a sealed bid.",
  },
  {
    title: "Move from award to work order",
    body: "The project manager compares bids side by side, and the selected award moves to escrow lock and a work order.",
  },
  {
    title: "Allocate tasks to members",
    body: "The vendor allocates project tasks to its members.",
  },
  {
    title: "Deliver through QA",
    body: "Members execute allocated work and delivery moves through the project QA gate.",
  },
  {
    title: "Invoice against milestones",
    body: "The vendor invoices against milestones after project-manager delivery approval and before finance payment approval.",
  },
] as const;

export const capabilityRequirements = [
  {
    title: "Company evidence",
    body: "India-based vendors provide GST, Udyam, company PAN, incorporation evidence, and bank proof. Other regions follow their local incorporation, tax, and bank-proof checklist.",
  },
  {
    title: "Signatory and ownership checks",
    body: "Every vendor completes signatory KYC, an ownership declaration, sanctions screening, and MSA e-sign.",
  },
  {
    title: "Capability profile",
    body: "The agency documents its capabilities for verifier review before it can bid.",
  },
  {
    title: "Member readiness",
    body: "Invited members complete lighter identity checks and category tests and remain individually tracked under the agency.",
  },
  {
    title: "Tax profile",
    body: "The vendor tax profile records residency, a tax identification reference, required forms, and the applicable withholding rule.",
  },
] as const;

export const rfpModel = [
  {
    title: "Project setup",
    body: "Projects can use vendor work and the vendor RFP staffing mode.",
  },
  {
    title: "Vendor-only posting",
    body: "A project manager posts the RFP for vendors rather than the open job board.",
  },
  {
    title: "Sealed responses",
    body: "Each vendor prepares a sealed bid for the project requirements.",
  },
  {
    title: "Side-by-side review",
    body: "The project manager compares vendor bids side by side and selects an award.",
  },
  {
    title: "Award to delivery",
    body: "The award establishes milestones and escrow, while the work order supports member allocation and delivery.",
  },
  {
    title: "Milestone invoicing",
    body: "Vendor invoices are checked against milestones through project-manager delivery approval and finance payment approval.",
  },
] as const;

export const vendorFaq = [
  {
    question: "What does an agency complete before bidding?",
    answer:
      "The vendor path includes KYB documents, signatory KYC, an MSA, a capability profile, and verifier approval before bidding.",
  },
  {
    question: "Which company documents are reviewed?",
    answer:
      "India-based agencies provide GST, Udyam, company PAN, incorporation evidence, and bank proof. Agencies elsewhere follow their regional incorporation, tax, and bank-proof checklist.",
  },
  {
    question: "What happens to invited team members?",
    answer:
      "Invited members complete lighter identity checks and category tests and remain individually tracked under the agency.",
  },
  {
    question: "How are agency capabilities used?",
    answer:
      "The capability profile is part of verifier review, and the vendor must be approved before it can bid.",
  },
  {
    question: "How do vendor RFPs work?",
    answer:
      "A project manager posts a vendor-only RFP, vendors prepare sealed bids, and the project manager compares the bids side by side before awarding the selected vendor.",
  },
  {
    question: "What happens after an award?",
    answer:
      "The vendor flow locks escrow, completes the work order, allocates tasks to members, and moves delivery through the project QA gate.",
  },
  {
    question: "How are vendor invoices approved?",
    answer:
      "Vendor invoices are checked against milestones. Project-manager delivery approval comes before finance payment approval.",
  },
  {
    question: "Can my agency register today?",
    answer:
      "Vendor registration is not open yet. eQOURSE+ is being built. This page exists so agencies know what to expect from the verification, member, RFP, and invoicing flows.",
  },
] as const;

export const vendorStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vendorFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
  {
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
        name: "For vendors",
        item: "https://plus.eqourse.com/vendors",
      },
    ],
  },
] as const;
