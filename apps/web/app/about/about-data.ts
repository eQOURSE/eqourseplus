import {
  certifications,
  PARENT_ORGANIZATION_ID,
  PLATFORM_ORGANIZATION_ID,
  parentOrganization,
} from "../site-structured-data";

export const ABOUT_TITLE =
  "About eQOURSE+ | Verified AI Data & Content Talent Network";
export const ABOUT_DESCRIPTION =
  "eQOURSE+ is the verified talent and vendor network by eQOURSE — KYC-verified specialists and accredited agencies for AI data and multilingual content.";

export const expertiseDomains = [
  ["Language and Linguistics", "Multilingual specialists supporting annotation, translation, localisation, speech data and language model evaluation with cultural and linguistic precision."],
  ["Science and STEM", "Subject specialists in physics, chemistry, biology, mathematics and related fields for technical evaluation and high-cognition reasoning tasks."],
  ["Coding and Technology", "Developers and technical experts reviewing, debugging and assessing AI-generated code across languages and architectures."],
  ["Finance and Mathematics", "Specialists applying quantitative reasoning, financial modelling, risk analysis and mathematical rigour to structured tasks."],
  ["Medical and Healthcare", "Domain experts supporting clinical reasoning, medical literature and content review, diagnostic logic and healthcare-related evaluation."],
  ["Education and Curriculum", "Specialists designing learning resources, assessments, instructional frameworks and educational content to institutional standards."],
  ["Autonomous Vehicles and Robotics", "Technical specialists contributing to perception data, sensor annotation, scenario evaluation and robotics workflows."],
  ["Quality Assurance and Evaluation", "Experts focused on model output review, preference ranking, safety assessment and structured quality validation across domains."],
] as const;

export const faqs = [
  ["What is eQOURSE+?", "eQOURSE+ is a verified talent and vendor network that connects project teams with qualified specialists and agencies for AI data, multilingual content and expert-led project delivery."],
  ["Who is eQOURSE+ for?", "It serves companies seeking verified specialists or vendor teams, individual specialists seeking structured project opportunities, and vendor agencies seeking organised delivery pathways."],
  ["Is eQOURSE+ part of eQOURSE?", "Yes. eQOURSE+ is the verified talent and vendor network within the eQOURSE ecosystem."],
  ["What types of specialists are available?", "Verified specialists include domain subject-matter experts, language experts, STEM specialists, coding specialists, content experts, AI evaluators and quality reviewers."],
  ["What types of AI data projects can eQOURSE+ support?", "Projects include data annotation, AI training data, RLHF and human feedback, model evaluation, speech and audio data, multimodal work and structured reasoning tasks."],
  ["How are specialists verified?", "Specialists complete identity verification, skills profiling and structured assessment before joining the talent pool."],
  ["How are vendor agencies verified?", "Vendor agencies complete organisation verification, capability review and formal onboarding before participating in projects."],
  ["Does eQOURSE+ support multilingual projects?", "Yes. The platform supports work across more than 30 languages, with specialists who bring linguistic and cultural precision."],
  ["Where does eQOURSE+ operate?", "eQOURSE+ operates with dual Singapore and India governance and supports global project delivery."],
  ["How does eQOURSE+ maintain quality?", "Quality is supported through verification, skill assessment, structured matching, clear standards and consistent review throughout delivery."],
] as const;

const organization = {
  "@context": "https://schema.org", "@type": "Organization", "@id": PLATFORM_ORGANIZATION_ID,
  name: "eQOURSE+", url: "https://plus.eqourse.com", parentOrganization,
  sameAs: ["https://twitter.com/EQourse"],
  address: [
    { "@type": "PostalAddress", addressCountry: "India" },
    { "@type": "PostalAddress", addressCountry: "Singapore" },
  ],
  hasCertification: certifications,
} as const;

const faqPage = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question", name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
} as const;

const breadcrumbList = {
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://plus.eqourse.com/" },
    { "@type": "ListItem", position: 2, name: "About", item: "https://plus.eqourse.com/about" },
  ],
} as const;

export const aboutStructuredData = [organization, faqPage, breadcrumbList] as const;
export { PARENT_ORGANIZATION_ID };
