import { z } from "zod";

import { ProfileSection } from "../states/profile-section";

const nonEmptyString = z.string().trim().min(1);
const currentYear = new Date().getUTCFullYear();
const educationYear = z.number().int().min(1900).max(currentYear + 10);

const validLanguageTag = nonEmptyString.refine((value) => {
  try {
    Intl.getCanonicalLocales(value);
    return true;
  } catch {
    return false;
  }
}, "Must be a valid BCP 47 language tag");

const validTimeZone = nonEmptyString.refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}, "Must be a valid IANA time-zone identifier");

const supportedCurrencies = new Set(
  (
    Intl as typeof Intl & {
      supportedValuesOf(key: "currency"): string[];
    }
  ).supportedValuesOf("currency"),
);
const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .refine((value) => supportedCurrencies.has(value), "Must be an ISO 4217 currency code");

const personalDraftSchema = z.strictObject({
  firstName: nonEmptyString.optional(),
  lastName: nonEmptyString.optional(),
  headline: nonEmptyString.optional(),
  city: nonEmptyString.optional(),
});

const educationEntryDraftSchema = z
  .strictObject({
    institution: nonEmptyString.optional(),
    qualification: nonEmptyString.optional(),
    fieldOfStudy: nonEmptyString.optional(),
    startYear: educationYear.optional(),
    endYear: educationYear.optional(),
  })
  .refine(
    (value) =>
      value.startYear === undefined ||
      value.endYear === undefined ||
      value.endYear >= value.startYear,
    { message: "End year cannot be earlier than start year", path: ["endYear"] },
  );

const skillEntryDraftSchema = z.strictObject({
  taxonomySlug: nonEmptyString.optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
});

const languageEntryDraftSchema = z.strictObject({
  languageCode: validLanguageTag.optional(),
  proficiency: z
    .enum(["BASIC", "CONVERSATIONAL", "PROFESSIONAL", "NATIVE"])
    .optional(),
});

const experienceEntryDraftSchema = z
  .strictObject({
    organization: nonEmptyString.optional(),
    title: nonEmptyString.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    summary: nonEmptyString.optional(),
  })
  .refine(
    (value) =>
      value.startDate === undefined ||
      value.endDate === undefined ||
      value.endDate >= value.startDate,
    { message: "End date cannot be earlier than start date", path: ["endDate"] },
  );

const experienceDraftSchema = z.strictObject({
  totalMonths: z.number().int().min(0).max(960).optional(),
  entries: z.array(experienceEntryDraftSchema).optional(),
});

const availabilityDraftSchema = z.strictObject({
  availableFrom: z.coerce.date().optional(),
  weeklyHours: z.number().int().min(1).max(168).optional(),
  timeZone: validTimeZone.optional(),
});

const rateDraftSchema = z.strictObject({
  amountMinor: z.number().int().positive().optional(),
  currencyCode: currencyCode.optional(),
  unit: z.literal("HOUR").optional(),
});

export const profileDraftSchema = z.strictObject({
  resumeSection: z.enum(ProfileSection).optional(),
  personal: personalDraftSchema.optional(),
  education: z.array(educationEntryDraftSchema).optional(),
  skills: z.array(skillEntryDraftSchema).optional(),
  languages: z.array(languageEntryDraftSchema).optional(),
  experience: experienceDraftSchema.optional(),
  availability: availabilityDraftSchema.optional(),
  rate: rateDraftSchema.optional(),
});

const educationEntrySubmissionSchema = z.strictObject({
  institution: nonEmptyString,
  qualification: nonEmptyString,
  fieldOfStudy: nonEmptyString,
  startYear: educationYear,
  endYear: educationYear.optional(),
}).refine(
  (value) => value.endYear === undefined || value.endYear >= value.startYear,
  { message: "End year cannot be earlier than start year", path: ["endYear"] },
);

const experienceEntrySubmissionSchema = z.strictObject({
  organization: nonEmptyString,
  title: nonEmptyString,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  summary: nonEmptyString.optional(),
}).refine(
  (value) => value.endDate === undefined || value.endDate >= value.startDate,
  { message: "End date cannot be earlier than start date", path: ["endDate"] },
);

export const profileSubmissionSchema = z.strictObject({
  resumeSection: z.enum(ProfileSection).optional(),
  personal: z.strictObject({
    firstName: nonEmptyString,
    lastName: nonEmptyString,
    headline: nonEmptyString.optional(),
    city: nonEmptyString.optional(),
  }),
  education: z.tuple([educationEntrySubmissionSchema]).rest(educationEntryDraftSchema),
  skills: z
    .tuple([
      z.strictObject({
        taxonomySlug: nonEmptyString,
        level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
      }),
    ])
    .rest(skillEntryDraftSchema),
  languages: z
    .tuple([
      z.strictObject({
        languageCode: validLanguageTag,
        proficiency: z.enum(["BASIC", "CONVERSATIONAL", "PROFESSIONAL", "NATIVE"]),
      }),
    ])
    .rest(languageEntryDraftSchema),
  experience: z.strictObject({
    totalMonths: z.number().int().min(0).max(960),
    entries: z.tuple([experienceEntrySubmissionSchema]).rest(experienceEntryDraftSchema),
  }),
  availability: z.strictObject({
    availableFrom: z.coerce.date(),
    weeklyHours: z.number().int().min(1).max(168),
    timeZone: validTimeZone,
  }),
  rate: z.strictObject({
    amountMinor: z.number().int().positive(),
    currencyCode,
    unit: z.literal("HOUR"),
  }),
});

export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type ProfileSubmissionInput = z.infer<typeof profileSubmissionSchema>;

const present = (value: unknown): boolean =>
  value !== undefined && (typeof value !== "string" || value.length > 0);

export function calculateProfileCompletionPercentage(
  draft: ProfileDraftInput,
): number {
  const education = draft.education?.[0];
  const skill = draft.skills?.[0];
  const language = draft.languages?.[0];
  const experience = draft.experience?.entries?.[0];
  const checks = [
    draft.personal?.firstName,
    draft.personal?.lastName,
    education?.institution,
    education?.qualification,
    education?.fieldOfStudy,
    education?.startYear,
    skill?.taxonomySlug,
    skill?.level,
    language?.languageCode,
    language?.proficiency,
    draft.experience?.totalMonths,
    experience?.organization,
    experience?.title,
    experience?.startDate,
    draft.availability?.availableFrom,
    draft.availability?.weeklyHours,
    draft.availability?.timeZone,
    draft.rate?.amountMinor,
    draft.rate?.currencyCode,
    draft.rate?.unit,
  ];
  return checks.filter(present).length * 5;
}
