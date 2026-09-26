export const CLIENTS_TITLE = "Enterprise AI Data & Expert Content Teams | eQOURSE+";
export const CLIENTS_DESCRIPTION =
  "Engage verified expert teams for AI data, multilingual content and accountable project delivery through eQOURSE+.";

export const clientJourney = [
  ["01 Requirements & Brief", "We align on scope, SLAs, domain expertise, and dataset parameters."],
  ["02 Scoping & RFP", "Confirm deliverables, timeline and milestones."],
  ["03 Team Assembly", "Match verified specialists or vendor teams."],
  ["04 Calibration & Pilot", "Establishing strict QA benchmarks & error tax logic."],
  ["05 Production Rollout", "Scale to the agreed delivery workflow."],
  ["06 Audit & QA", "3-tier review, multi-pass validation, and delivery approval."],
  ["07 Milestone Handoff", "Milestones reviewed and accepted together."],
  ["08 Reporting & Support", "Delivery summary and audit trail shared."],
] as const;

export const clientCapabilities = [
  ["AI Training & Fine-Tuning", "Domain-expert feedback, RLHF, SFT, and code evaluation for model training."],
  ["Code & Technical Annotation", "Code generation, bug identification, doc writing, and repository annotation."],
  ["Multilingual & Translation", "Translation, localization, and cross-cultural evaluation across 50+ languages."],
  ["STEM & Technical Content", "Rigorous expert content creation across math, physics, engineering, and CS."],
  ["Domain-Specific Writing", "High-quality technical, legal, financial, and medical writing and editing."],
] as const;

export interface ClientDomain {
  title: string;
  desc: string;
  icon: "globe" | "code" | "finance" | "medical" | "content";
}

export const clientDomains: readonly ClientDomain[] = [
  {
    title: "Languages & Multilingual",
    desc: "Multilingual translation, localization, native dialect review, NLP datasets.",
    icon: "globe",
  },
  {
    title: "STEM & Coding",
    desc: "Higher math, physics, chemistry, biology, statistics, software engineering.",
    icon: "code",
  },
  {
    title: "Finance & Legal",
    desc: "Financial modeling, tax, corporate law, compliance, accounting.",
    icon: "finance",
  },
  {
    title: "Clinical Medicine",
    desc: "Clinical medicine, pharmacology, medical coding, health tech.",
    icon: "medical",
  },
  {
    title: "Enterprise Content",
    desc: "Technical writing, documentation, enterprise communication, editorial.",
    icon: "content",
  },
];

export interface ClientQualityControl {
  title: string;
  desc: string;
  icon: "check" | "layers" | "search" | "shield" | "sliders";
}

export const clientQualityControls: readonly ClientQualityControl[] = [
  { title: "Pre-calibration", desc: "Benchmark calibration before scaling batch production.", icon: "check" },
  { title: "Multi-pass Review", desc: "Independent secondary and tertiary human review rounds.", icon: "layers" },
  { title: "Error Taxonomy", desc: "Strict category-based error tracking & remediation.", icon: "search" },
  { title: "Audit Trails", desc: "Full transparency into annotator actions and changes.", icon: "shield" },
  { title: "Automated Checks", desc: "Heuristic and model-assisted pre-validation.", icon: "sliders" },
];

export interface ClientQualityMetric {
  label: string;
  value: string;
  tag: string;
  note: string;
}

export const clientQualityMetrics: readonly ClientQualityMetric[] = [
  { label: "ACCURACY BENCHMARK", value: "99.2%", tag: "Verified target", note: "Cross-evaluated on random control samples" },
  { label: "QA REJECTION RATE", value: "< 0.5%", tag: "Target threshold", note: "Strict upfront calibration keeps rework minimal" },
  { label: "ON-TIME DELIVERY", value: "99.6%", tag: "SLA guarantee", note: "Tracked against milestone commitments" },
];

export interface ClientGovernanceItem {
  title: string;
  desc: string;
  icon: "lock" | "shield" | "fileCheck" | "userCheck" | "briefcase";
}

export const clientGovernance: readonly ClientGovernanceItem[] = [
  { title: "Access Controls", desc: "Role-based access, strict IP allowlisting, and air-gapped environments.", icon: "lock" },
  { title: "IP Protection", desc: "Comprehensive NDAs, work-for-hire assignment, and data isolation.", icon: "shield" },
  { title: "Information Security", desc: "ISO 27001 processes, SOC 2 compliance, and end-to-end encryption.", icon: "fileCheck" },
  { title: "Vendor Management", desc: "Screened vendor network, SLA enforcement, and background checks.", icon: "userCheck" },
  { title: "Contract Governance", desc: "Master Services Agreements, clear milestone terms, and transparent billing.", icon: "briefcase" },
];

export interface ClientScaleStep {
  step: string;
  title: string;
  desc: string;
}

export const clientScaleSteps: readonly ClientScaleStep[] = [
  { step: "01", title: "01 Brief", desc: "Align scope & initial parameters" },
  { step: "02", title: "02 Pilot", desc: "Small-scale trial run for calibration" },
  { step: "03", title: "03 Verified Specialists", desc: "Hand-picked domain experts" },
  { step: "04", title: "04 Vendor Capacity", desc: "Scale execution with partner vendors" },
  { step: "05", title: "05 Managed Production", desc: "End-to-end delivery & dedicated QA" },
];

export interface ClientDeliveryCase {
  title: string;
  challenge: string;
  solution: string;
  results: string;
  takeaway: string;
}

export const clientDeliveryCases: readonly ClientDeliveryCase[] = [
  {
    title: "Multilingual AI Data Delivery",
    challenge: "Multi-language dataset collection across 20+ low-resource languages.",
    solution: "Pre-screened native linguists + automated format validation.",
    results: "100k+ high-accuracy data items delivered on schedule.",
    takeaway: "Scale without sacrificing accuracy.",
  },
  {
    title: "Expert Content Production",
    challenge: "Domain-expert STEM question & answer creation for LLM benchmark.",
    solution: "PhD & Master's verified annotators + double-blind peer review.",
    results: "Zero critical error rate across 5,000 complex technical samples.",
    takeaway: "Rigorous verification builds trust.",
  },
];

export const clientFaq = [
  ["What background checks and NDAs are enforced?", "Experts complete identity checks, background verification, and non-disclosure agreements before project assignment."],
  ["How does eQOURSE+ match experts to our domain?", "We evaluate verified credentials, academic qualifications, and past project performance to match domain-specific annotators."],
  ["Can eQOURSE+ provide customized AI training pipelines?", "Yes. We configure specialized annotation taxonomies, custom UI interfaces, and custom QA workflows tailored to your model requirements."],
  ["How do quality guarantees and rework terms work?", "Every milestone includes defined acceptance criteria. Output failing calibration benchmarks is remediated at no extra cost."],
  ["How fast can a specialist team be assembled?", "Pilot teams can be launched within 48 to 72 hours following brief alignment and taxonomy setup."],
  ["How are dataset rights and IP handled for projects?", "All work product is fully assigned to the client under work-for-hire terms with strict data privacy and isolation."],
  ["What security controls protect client dataset IP?", "Data access is restricted via RBAC, optional air-gapped environments, encrypted transport, and zero data retention outside project scope."],
  ["Does eQOURSE+ partner with specialized vendors?", "Yes. For high-volume execution, we coordinate with verified partner vendor teams under centralized QA and contract governance."],
  ["How can we start a pilot before a full commitment?", "We start with a 1-2 week calibration pilot to validate accuracy, alignment, and throughput before scaling production."],
  ["Do you support custom workflows or human-in-the-loop?", "Yes. We support custom SFT, RLHF preference ranking, red-teaming, and multi-turn conversational evaluation pipelines."],
] as const;

export const clientStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://plus.eqourse.com/" },
        { "@type": "ListItem", position: 2, name: "Clients", item: "https://plus.eqourse.com/clients" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: clientFaq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
} as const;
