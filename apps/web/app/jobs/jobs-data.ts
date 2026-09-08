import { PLATFORM_ORGANIZATION_ID } from "../site-structured-data";

export type SeedJob = {
  slug: string;
  title: string;
  businessUnit: "EQOURSE" | "TUTRAIN";
  category: string;
  languages: readonly string[];
  description: string;
  skills: readonly string[];
  workType: "task" | "hourly" | "milestone";
  rate: string;
  datePosted: string;
  validThrough: string;
  requiredTest: string;
  qualityBar: string;
};

export const seededJobs: readonly SeedJob[] = [
  {
    slug: "hindi-ai-response-evaluator",
    title: "Hindi AI response evaluator",
    businessUnit: "EQOURSE",
    category: "AI Data Services",
    languages: ["Hindi", "English"],
    description:
      "Evaluate Hindi and English AI responses against clear quality rubrics and provide consistent written feedback.",
    skills: ["Annotation", "Response evaluation", "Written feedback"],
    workType: "task",
    rate: "Rate shared during project matching",
    datePosted: "2026-08-20",
    validThrough: "2026-10-31",
    requiredTest: "AI response evaluation",
    qualityBar: "Rubric-led review with sampled QA",
  },
  {
    slug: "english-curriculum-reviewer",
    title: "English curriculum reviewer",
    businessUnit: "EQOURSE",
    category: "Content Services",
    languages: ["English"],
    description:
      "Review structured learning content for clarity, accuracy, and alignment with the supplied curriculum brief.",
    skills: ["Curriculum", "Content review", "Quality assurance"],
    workType: "hourly",
    rate: "Rate shared during project matching",
    datePosted: "2026-08-22",
    validThrough: "2026-11-15",
    requiredTest: "Content review",
    qualityBar: "Brief-led review with sampled QA",
  },
  {
    slug: "english-neet-biology-content-specialist",
    title: "English NEET Biology content specialist",
    businessUnit: "TUTRAIN",
    category: "Tutoring",
    languages: ["English"],
    description:
      "Create and review accurate NEET Biology explanations and practice material against a supplied brief.",
    skills: ["NEET Biology", "Subject expertise", "Content review"],
    workType: "milestone",
    rate: "Rate shared during project matching",
    datePosted: "2026-08-25",
    validThrough: "2026-11-30",
    requiredTest: "NEET Biology",
    qualityBar: "Subject rubric with sampled QA",
  },
] as const;

export const JOB_CATEGORIES = [...new Set(seededJobs.map((job) => job.category))];
export const JOB_LANGUAGES = [
  ...new Set(seededJobs.flatMap((job) => job.languages)),
];

export function getJobs(filters: { category?: string; language?: string } = {}) {
  return seededJobs.filter(
    (job) =>
      (!filters.category || filters.category === job.category) &&
      (!filters.language || job.languages.includes(filters.language)),
  );
}

export function getJobBySlug(slug: string) {
  return seededJobs.find((job) => job.slug === slug);
}

export function getJobPostingStructuredData(job: SeedJob) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: "CONTRACTOR",
    hiringOrganization: { "@id": PLATFORM_ORGANIZATION_ID },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Worldwide",
    },
    url: `https://plus.eqourse.com/jobs/${job.slug}`,
  };
}
