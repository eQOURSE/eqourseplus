export const FREELANCERS_TITLE =
  "Freelance AI Data & Content Work | eQOURSE+";
export const FREELANCERS_DESCRIPTION =
  "Build a verified freelancer profile, take proctored skill tests, join tiered project teams, deliver through QA, and receive country-aware payouts.";

export const freelancerJourney = [
  {
    title: "Register",
    body: "Create your account.",
  },
  {
    title: "Build profile",
    body: "Skills, samples, availability, rate.",
  },
  {
    title: "Verify",
    body: "Identity, bank, agreement.",
  },
  {
    title: "Prove your skills",
    body: "Take a proctored category test.",
  },
  {
    title: "Badge and tier",
    body: "Earn a category badge and starting tier.",
  },
  {
    title: "Get matched",
    body: "Skills, quality, availability.",
  },
  {
    title: "Deliver",
    body: "Work in the QA-led workbench.",
  },
  {
    title: "Get paid",
    body: "Accepted work enters payout.",
  },
] as const;

export const verificationDetails = [
  {
    title: "Identity verification",
    body: "KYC captures a government ID, selfie liveness check, and address proof. Bank verification and e-sign complete the freelancer verification path.",
  },
  {
    title: "Proctored skill testing",
    body: "Category tests can include objective, rubric-scored, and practical work. Proctoring checks continuous face presence, face match against the KYC selfie, and secure-browser signals; flagged attempts require human review before a final result.",
  },
  {
    title: "Badges and tiers",
    body: "Passing a category test assigns its badge and a starting Bronze, Silver, or Gold tier based on score bands. Tier and quality signals support project matching.",
  },
  {
    title: "Quality over time",
    body: "Sampling QA feeds a live quality score, and tier changes retain a history.",
  },
] as const;

export const countryHandling = [
  {
    title: "India",
    body: "India-based talent follows the India contract entity and the applicable TDS and GST workflows.",
  },
  {
    title: "International",
    body: "Talent outside India follows the Singapore contract entity, with residency and tax-profile rules guiding withholding.",
  },
] as const;

export const freelancerFaq = [
  {
    question: "What do I need to complete before joining project work?",
    answer:
      "The freelancer path includes a completed profile, KYC, bank verification, e-sign, a proctored category test, and the required human review before approval.",
  },
  {
    question: "What does KYC verify?",
    answer:
      "KYC checks a government ID, selfie liveness, face match, and address proof. Verification results are stored, while raw Aadhaar is not stored.",
  },
  {
    question: "How are skill tests supervised?",
    answer:
      "Proctored tests use webcam checks, continuous face presence, face matching against the KYC selfie, and secure-browser signals. Flagged attempts require review before a final result.",
  },
  {
    question: "How do badges and tiers work?",
    answer:
      "Passing a category test assigns a category badge and a starting Bronze, Silver, or Gold tier based on score bands. Tier and quality signals are then available for project matching.",
  },
  {
    question: "How am I matched to projects?",
    answer:
      "Matching can consider skills, languages, tier, quality, availability, rate, timezone, device, and work history against the needs of a project.",
  },
  {
    question: "What happens after I submit work?",
    answer:
      "Submitted work can move to QA or automatic acceptance. QA may accept it, return it for rework, or reject it, and sampled reviews feed the quality score.",
  },
  {
    question: "How do payouts differ by country?",
    answer:
      "Accepted work enters the earnings ledger and the relevant payout cycle. India-based talent follows the India contract entity with TDS and GST workflows, while international talent follows the Singapore contract entity under the applicable tax profile.",
  },
  {
    question: "Can I create an account today?",
    answer:
      "Yes. Create an account, verify your email, and build your profile to begin the specialist path. Verification and testing are completed before you are matched to project work.",
  },
] as const;

export const freelancerStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: freelancerFaq.map((item) => ({
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
        name: "For freelancers",
        item: "https://plus.eqourse.com/freelancers",
      },
    ],
  },
] as const;
