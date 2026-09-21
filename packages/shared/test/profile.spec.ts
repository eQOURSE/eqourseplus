import { describe, expect, it } from "vitest";

import {
  calculateProfileCompletionPercentage,
  ProfileSection,
  profileDraftSchema,
  profileSubmissionSchema,
} from "../src";

const completeDraft = () =>
  profileDraftSchema.parse({
    personal: {
      firstName: "Ada",
      lastName: "Lovelace",
    },
    education: [
      {
        institution: "University of London",
        qualification: "Certificate",
        fieldOfStudy: "Mathematics",
        startYear: 2020,
      },
    ],
    skills: [
      {
        taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
        level: "EXPERT",
      },
    ],
    languages: [
      {
        languageCode: "en-GB",
        proficiency: "NATIVE",
      },
    ],
    experience: {
      totalMonths: 120,
      entries: [
        {
          organization: "Analytical Engine",
          title: "Programmer",
          startDate: "1842-01-01T00:00:00.000Z",
        },
      ],
    },
    availability: {
      availableFrom: "2026-10-01T00:00:00.000Z",
      weeklyHours: 40,
      timeZone: "Europe/London",
    },
    rate: {
      amountMinor: 12_500,
      currencyCode: "GBP",
      unit: "HOUR",
    },
  });

describe("FR-REG-02B profile draft contracts", () => {
  it("keeps one shared profile-section definition including out-of-scope samples", () => {
    expect(Object.values(ProfileSection)).toEqual([
      "PERSONAL",
      "EDUCATION",
      "SKILLS",
      "LANGUAGES",
      "EXPERIENCE",
      "SAMPLES",
      "AVAILABILITY",
      "RATE",
    ]);
  });

  it("accepts a wholly empty partial draft but keeps submission strict", () => {
    expect(profileDraftSchema.parse({})).toEqual({});
    expect(profileSubmissionSchema.safeParse({}).success).toBe(false);
    expect(profileSubmissionSchema.safeParse(completeDraft()).success).toBe(true);
  });

  it("rejects server-owned and unknown fields from draft input", () => {
    expect(profileDraftSchema.safeParse({ state: "APPROVED" }).success).toBe(
      false,
    );
    expect(
      profileDraftSchema.safeParse({ completionPercentage: 100 }).success,
    ).toBe(false);
    expect(profileDraftSchema.safeParse({ samples: [] }).success).toBe(false);
  });

  it.each([
    [{ personal: { firstName: "Ada", lastName: "Lovelace" } }, 10],
    [
      {
        education: [
          {
            institution: "University of London",
            qualification: "Certificate",
            fieldOfStudy: "Mathematics",
            startYear: 2020,
          },
        ],
      },
      20,
    ],
    [
      {
        skills: [
          {
            taxonomySlug:
              "eqourse-ai-data-services-annotation-bounding-box",
            level: "ADVANCED",
          },
        ],
      },
      10,
    ],
    [
      {
        languages: [
          { languageCode: "en-IN", proficiency: "PROFESSIONAL" },
        ],
      },
      10,
    ],
    [
      {
        experience: {
          totalMonths: 24,
          entries: [
            {
              organization: "Example",
              title: "Annotator",
              startDate: "2024-01-01T00:00:00.000Z",
            },
          ],
        },
      },
      20,
    ],
    [
      {
        availability: {
          availableFrom: "2026-10-01T00:00:00.000Z",
          weeklyHours: 40,
          timeZone: "Asia/Kolkata",
        },
      },
      15,
    ],
    [
      {
        rate: { amountMinor: 10_000, currencyCode: "INR", unit: "HOUR" },
      },
      15,
    ],
  ])("counts only the fixed twenty required checks in %j", (input, expected) => {
    const draft = profileDraftSchema.parse(input);
    expect(calculateProfileCompletionPercentage(draft)).toBe(expected);
  });

  it("does not lower completion when partial second entries are added", () => {
    const firstEntriesOnly = completeDraft();
    const withAdditionalEntries = profileDraftSchema.parse({
      ...firstEntriesOnly,
      education: [
        ...(firstEntriesOnly.education ?? []),
        { institution: "A second, still-partial education entry" },
      ],
      skills: [
        ...(firstEntriesOnly.skills ?? []),
        { taxonomySlug: "tutrain-tutoring-neet-biology" },
      ],
      experience: {
        ...(firstEntriesOnly.experience ?? {}),
        entries: [
          ...(firstEntriesOnly.experience?.entries ?? []),
          { organization: "A second, still-partial experience entry" },
        ],
      },
    });

    const before = calculateProfileCompletionPercentage(firstEntriesOnly);
    const after = calculateProfileCompletionPercentage(withAdditionalEntries);

    expect(before).toBe(100);
    expect(after).toBe(before);
  });

  it("does not lower a partial 10-of-20 baseline when partial second entries are added", () => {
    const tenChecks = profileDraftSchema.parse({
      personal: { firstName: "Ada", lastName: "Lovelace" },
      education: [
        {
          institution: "University of London",
          qualification: "Certificate",
          fieldOfStudy: "Mathematics",
          startYear: 2020,
        },
      ],
      skills: [
        {
          taxonomySlug:
            "eqourse-ai-data-services-annotation-bounding-box",
          level: "EXPERT",
        },
      ],
      experience: {
        totalMonths: 120,
        entries: [{ organization: "Analytical Engine" }],
      },
    });
    const withAdditionalEntries = profileDraftSchema.parse({
      ...tenChecks,
      education: [
        ...(tenChecks.education ?? []),
        { institution: "A second, still-partial education entry" },
      ],
      skills: [
        ...(tenChecks.skills ?? []),
        { taxonomySlug: "tutrain-tutoring-neet-biology" },
      ],
      experience: {
        ...(tenChecks.experience ?? {}),
        entries: [
          ...(tenChecks.experience?.entries ?? []),
          { organization: "A second, still-partial experience entry" },
        ],
      },
    });

    const before = calculateProfileCompletionPercentage(tenChecks);
    const after = calculateProfileCompletionPercentage(withAdditionalEntries);

    expect(before).toBe(50);
    expect(after).toBe(before);
  });

  it("enforces the v2.28 bounds only when optional fields are present", () => {
    const currentYear = new Date().getUTCFullYear();
    for (const valid of [
      { availability: { weeklyHours: 1 } },
      { availability: { weeklyHours: 168 } },
      { experience: { totalMonths: 0 } },
      { experience: { totalMonths: 960 } },
      { education: [{ startYear: 1900, endYear: currentYear + 10 }] },
      {
        experience: {
          entries: [
            {
              startDate: "2025-01-01T00:00:00.000Z",
              endDate: "2025-01-01T00:00:00.000Z",
            },
          ],
        },
      },
      { rate: { amountMinor: 1, currencyCode: "INR" } },
      { languages: [{ languageCode: "en-IN" }] },
      { availability: { timeZone: "Asia/Kolkata" } },
    ]) {
      expect(profileDraftSchema.safeParse(valid).success).toBe(true);
    }

    for (const invalid of [
      { availability: { weeklyHours: 0 } },
      { availability: { weeklyHours: 169 } },
      { availability: { weeklyHours: 1.5 } },
      { experience: { totalMonths: -1 } },
      { experience: { totalMonths: 961 } },
      { education: [{ startYear: 1899 }] },
      { education: [{ startYear: currentYear + 11 }] },
      { education: [{ startYear: 2025, endYear: 2024 }] },
      {
        experience: {
          entries: [
            {
              startDate: "2025-01-02T00:00:00.000Z",
              endDate: "2025-01-01T00:00:00.000Z",
            },
          ],
        },
      },
      { rate: { amountMinor: 0 } },
      { rate: { amountMinor: 1.5 } },
      { rate: { currencyCode: "inr" } },
      { rate: { currencyCode: "ZZZ" } },
      { languages: [{ languageCode: "not_a_language" }] },
      { availability: { timeZone: "Mars/Olympus_Mons" } },
    ]) {
      expect(profileDraftSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
