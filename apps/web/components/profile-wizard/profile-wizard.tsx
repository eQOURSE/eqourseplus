"use client";

import {
  ProfileSection,
  ProfileState,
  profileSampleUploadRequestSchema,
  profileSampleUploadResponseSchema,
  profileDraftSchema,
  type ProfileDraftInput,
} from "@eqourse/shared";
import { FrostedSurface, GlassButton } from "@eqourse/ui";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { publicApiUrl } from "../../lib/public-api-url";

type EducationForm = {
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
};

type SkillForm = { taxonomySlug: string; level: string };
type LanguageForm = { languageCode: string; proficiency: string };
type ExperienceEntryForm = {
  organization: string;
  title: string;
  startDate: string;
  endDate: string;
  currentlyWorks: boolean;
  summary: string;
};
type SampleForm = { title: string; objectKey: string; uploadedAt: string; fileName: string };

interface ProfileFormState {
  personal: { firstName: string; lastName: string; headline: string; city: string };
  education: EducationForm[];
  skills: SkillForm[];
  languages: LanguageForm[];
  experience: { totalMonths: string; entries: ExperienceEntryForm[] };
  samples: SampleForm[];
  availability: { availableFrom: string; weeklyHours: string; timeZone: string };
  rate: { amountMinor: string; currencyCode: string; unit: string };
}

interface TaxonomyOption {
  businessUnit: string;
  serviceLine: string;
  skill: string;
  specialization: string | null;
  slug: string;
}

interface ProfileResponse extends ProfileDraftInput {
  completionPercentage: number;
  state: ProfileState;
  userId: string;
}

const EMPTY_EDUCATION: EducationForm = {
  institution: "",
  qualification: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
};
const EMPTY_SKILL: SkillForm = { taxonomySlug: "", level: "" };
const EMPTY_LANGUAGE: LanguageForm = { languageCode: "", proficiency: "" };
const EMPTY_EXPERIENCE: ExperienceEntryForm = {
  organization: "",
  title: "",
  startDate: "",
  endDate: "",
  currentlyWorks: true,
  summary: "",
};
const EMPTY_SAMPLE: SampleForm = { title: "", objectKey: "", uploadedAt: "", fileName: "" };
const EMPTY_FORM: ProfileFormState = {
  personal: { firstName: "", lastName: "", headline: "", city: "" },
  education: [{ ...EMPTY_EDUCATION }],
  skills: [{ ...EMPTY_SKILL }],
  languages: [{ ...EMPTY_LANGUAGE }],
  experience: { totalMonths: "", entries: [{ ...EMPTY_EXPERIENCE }] },
  samples: [{ ...EMPTY_SAMPLE }],
  availability: { availableFrom: "", weeklyHours: "", timeZone: "" },
  rate: { amountMinor: "", currencyCode: "INR", unit: "" },
};

const WIZARD_SECTIONS: readonly ProfileSection[] = Object.values(ProfileSection);
const SECTION_LABELS: Readonly<Record<ProfileSection, string>> = {
  [ProfileSection.PERSONAL]: "Personal",
  [ProfileSection.EDUCATION]: "Education",
  [ProfileSection.SKILLS]: "Skills",
  [ProfileSection.LANGUAGES]: "Languages",
  [ProfileSection.EXPERIENCE]: "Experience",
  [ProfileSection.SAMPLES]: "Samples",
  [ProfileSection.AVAILABILITY]: "Availability",
  [ProfileSection.RATE]: "Rate",
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function dateInput(value: unknown): string {
  if (typeof value !== "string" && !(value instanceof Date)) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

function numberInput(value: unknown): string {
  return typeof value === "number" ? String(value) : "";
}

function rateInput(value: unknown, currencyCode: string): string {
  if (typeof value !== "number") return "";
  return (value / (currencyCode === "JPY" ? 1 : 100)).toFixed(currencyCode === "JPY" ? 0 : 2);
}

function rateMinor(value: string, currencyCode: string): number | undefined {
  const normalized = value.trim();
  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const [whole, fraction = ""] = normalized.split(".");
  const digits = currencyCode === "JPY" ? 0 : 2;
  return Number(whole) * (10 ** digits) + Number((fraction + "00").slice(0, digits));
}

function formFromProfile(profile: ProfileResponse): ProfileFormState {
  return {
    personal: {
      firstName: text(profile.personal?.firstName),
      lastName: text(profile.personal?.lastName),
      headline: text(profile.personal?.headline),
      city: text(profile.personal?.city),
    },
    education: profile.education?.length
      ? profile.education.map((entry) => ({
          institution: text(entry.institution),
          qualification: text(entry.qualification),
          fieldOfStudy: text(entry.fieldOfStudy),
          startYear: numberInput(entry.startYear),
          endYear: numberInput(entry.endYear),
        }))
      : [{ ...EMPTY_EDUCATION }],
    skills: profile.skills?.length
      ? profile.skills.map((entry) => ({
          taxonomySlug: text(entry.taxonomySlug),
          level: text(entry.level),
        }))
      : [{ ...EMPTY_SKILL }],
    languages: profile.languages?.length
      ? profile.languages.map((entry) => ({
          languageCode: text(entry.languageCode),
          proficiency: text(entry.proficiency),
        }))
      : [{ ...EMPTY_LANGUAGE }],
    experience: {
      totalMonths: numberInput(profile.experience?.totalMonths),
      entries: profile.experience?.entries?.length
        ? profile.experience.entries.map((entry) => ({
            organization: text(entry.organization),
            title: text(entry.title),
            startDate: dateInput(entry.startDate),
            endDate: dateInput(entry.endDate),
            currentlyWorks: !entry.endDate,
            summary: text(entry.summary),
          }))
        : [{ ...EMPTY_EXPERIENCE }],
    },
    samples: profile.samples?.length
      ? profile.samples.map((entry) => ({
          title: text(entry.title),
          objectKey: text(entry.objectKey),
          uploadedAt: dateInput(entry.uploadedAt),
          fileName: "",
        }))
      : [{ ...EMPTY_SAMPLE }],
    availability: {
      availableFrom: dateInput(profile.availability?.availableFrom),
      weeklyHours: numberInput(profile.availability?.weeklyHours),
      timeZone: text(profile.availability?.timeZone),
    },
    rate: {
      amountMinor: rateInput(profile.rate?.amountMinor, text(profile.rate?.currencyCode)),
      currencyCode: text(profile.rate?.currencyCode),
      unit: text(profile.rate?.unit),
    },
  };
}

function nonEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalInteger(value: string): number | undefined {
  return value.trim() ? Number(value) : undefined;
}

function optionalDate(value: string): Date | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

function nonEmptyRecords<T extends Record<string, unknown>>(values: T[]): Partial<T>[] {
  return values.map(compact).filter((value) => Object.keys(value).length > 0);
}

function sectionPatch(
  section: ProfileSection,
  form: ProfileFormState,
): ProfileDraftInput {
  if (section === ProfileSection.PERSONAL) {
    return { personal: compact({
      firstName: nonEmpty(form.personal.firstName),
      lastName: nonEmpty(form.personal.lastName),
      headline: nonEmpty(form.personal.headline),
      city: nonEmpty(form.personal.city),
    }) };
  }
  if (section === ProfileSection.EDUCATION) {
    return { education: nonEmptyRecords(form.education.map((entry) => ({
      institution: nonEmpty(entry.institution),
      qualification: nonEmpty(entry.qualification),
      fieldOfStudy: nonEmpty(entry.fieldOfStudy),
      startYear: optionalInteger(entry.startYear),
      endYear: optionalInteger(entry.endYear),
    }))) };
  }
  if (section === ProfileSection.SKILLS) {
    return { skills: nonEmptyRecords(form.skills.map((entry) => ({
      taxonomySlug: nonEmpty(entry.taxonomySlug),
      level: nonEmpty(entry.level) as SkillForm["level"] | undefined,
    }))) } as ProfileDraftInput;
  }
  if (section === ProfileSection.LANGUAGES) {
    return { languages: nonEmptyRecords(form.languages.map((entry) => ({
      languageCode: nonEmpty(entry.languageCode),
      proficiency: nonEmpty(entry.proficiency) as LanguageForm["proficiency"] | undefined,
    }))) } as ProfileDraftInput;
  }
  if (section === ProfileSection.EXPERIENCE) {
    const entries = nonEmptyRecords(form.experience.entries.map((entry) => ({
      organization: nonEmpty(entry.organization),
      title: nonEmpty(entry.title),
      startDate: optionalDate(entry.startDate),
      endDate: optionalDate(entry.endDate),
      summary: nonEmpty(entry.summary),
    })));
    return { experience: compact({
      totalMonths: optionalInteger(form.experience.totalMonths),
      entries: entries.length ? entries : undefined,
    }) } as ProfileDraftInput;
  }
  if (section === ProfileSection.SAMPLES) {
    return { samples: nonEmptyRecords(form.samples.map((entry) => ({
      title: nonEmpty(entry.title),
      objectKey: nonEmpty(entry.objectKey),
      uploadedAt: entry.uploadedAt ? new Date(entry.uploadedAt) : undefined,
    }))) };
  }
  if (section === ProfileSection.AVAILABILITY) {
    return { availability: compact({
      availableFrom: optionalDate(form.availability.availableFrom),
      weeklyHours: optionalInteger(form.availability.weeklyHours),
      timeZone: nonEmpty(form.availability.timeZone),
    }) };
  }
  if (section === ProfileSection.RATE) {
    const currencyCode = nonEmpty(form.rate.currencyCode)?.toUpperCase() ?? "";
    return { rate: compact({
      amountMinor: rateMinor(form.rate.amountMinor, currencyCode),
      currencyCode: currencyCode || undefined,
      unit: nonEmpty(form.rate.unit) as "HOUR" | undefined,
    }) };
  }
  return {};
}

function complete(section: ProfileSection, form: ProfileFormState): boolean {
  if (section === ProfileSection.PERSONAL) {
    return Boolean(nonEmpty(form.personal.firstName) && nonEmpty(form.personal.lastName));
  }
  if (section === ProfileSection.EDUCATION) {
    const first = form.education[0];
    return Boolean(first && nonEmpty(first.institution) && nonEmpty(first.qualification)
      && nonEmpty(first.fieldOfStudy) && first.startYear);
  }
  if (section === ProfileSection.SKILLS) {
    const first = form.skills[0];
    return Boolean(first && nonEmpty(first.taxonomySlug) && nonEmpty(first.level));
  }
  if (section === ProfileSection.LANGUAGES) {
    const first = form.languages[0];
    return Boolean(first && nonEmpty(first.languageCode) && nonEmpty(first.proficiency));
  }
  if (section === ProfileSection.EXPERIENCE) {
    const first = form.experience.entries[0];
    return Boolean(form.experience.totalMonths && first && nonEmpty(first.organization)
      && nonEmpty(first.title) && first.startDate && (first.currentlyWorks || first.endDate));
  }
  if (section === ProfileSection.SAMPLES) {
    const first = form.samples[0];
    return Boolean(first && nonEmpty(first.title) && nonEmpty(first.objectKey));
  }
  if (section === ProfileSection.AVAILABILITY) {
    return Boolean(form.availability.availableFrom && form.availability.weeklyHours
      && nonEmpty(form.availability.timeZone));
  }
  if (section === ProfileSection.RATE) {
    return Boolean(form.rate.amountMinor && nonEmpty(form.rate.currencyCode)
      && form.rate.unit === "HOUR");
  }
  return true;
}

function firstIncompleteSection(form: ProfileFormState): ProfileSection {
  return WIZARD_SECTIONS.find((section) => !complete(section, form))
    ?? ProfileSection.RATE;
}

function fieldId(path: readonly PropertyKey[]): string {
  const parts = path.map(String);
  const [section, index, field] = parts;
  if (section === "languages") return `profile-language-${index ?? "0"}-${field ?? "languageCode"}`;
  if (section === "education") return `profile-education-${index ?? "0"}-${field ?? "institution"}`;
  if (section === "skills") return `profile-skill-${index ?? "0"}-${field ?? "taxonomySlug"}`;
  if (section === "experience" && index === "entries") {
    return `profile-experience-${field ?? "0"}-${parts[3] ?? "organization"}`;
  }
  if (section === "samples") return `profile-sample-${index ?? "0"}-${field ?? "title"}`;
  return `profile-${section ?? "form"}-${field ?? index ?? "field"}`;
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: unknown };
    if (typeof body.message === "string") return body.message;
    if (Array.isArray(body.message)) return body.message.filter((item) => typeof item === "string").join(" ");
  } catch {
    // The status-specific fallback below remains actionable without exposing internals.
  }
  return response.status === 401
    ? "Sign in again to save your profile."
    : "We could not save your profile. Try again.";
}

async function taxonomyOptions(): Promise<TaxonomyOption[]> {
  const response = await fetch(publicApiUrl("/api/v1/skill-taxonomy"));
  if (!response.ok) throw new Error("Taxonomy request failed");
  const body = await response.json() as unknown;
  if (!Array.isArray(body)) throw new Error("Taxonomy response was not a list");
  return body.filter((item): item is TaxonomyOption => Boolean(
    item && typeof item === "object"
    && typeof (item as TaxonomyOption).slug === "string"
    && typeof (item as TaxonomyOption).businessUnit === "string"
    && typeof (item as TaxonomyOption).serviceLine === "string"
    && typeof (item as TaxonomyOption).skill === "string"
    && (typeof (item as TaxonomyOption).specialization === "string"
      || (item as TaxonomyOption).specialization === null),
  ));
}

function taxonomyLabel(option: TaxonomyOption): string {
  return `${option.specialization ?? option.skill} — ${option.serviceLine}`;
}

export function ProfileWizard() {
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [section, setSection] = useState<ProfileSection>(ProfileSection.PERSONAL);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [profileState, setProfileState] = useState<ProfileState>(ProfileState.DRAFT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taxonomy, setTaxonomy] = useState<TaxonomyOption[]>([]);
  const [taxonomyStatus, setTaxonomyStatus] = useState<"loading" | "ready" | "error">("loading");
  const dirty = useRef(new Set<ProfileSection>());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const activeTaxonomySlugs = useMemo(
    () => new Set(taxonomy.map((option) => option.slug)),
    [taxonomy],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/v1/profiles/me", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("We could not load your profile. Refresh and try again.");
        return response.json() as Promise<ProfileResponse>;
      }),
      taxonomyOptions(),
    ]).then(([profile, options]) => {
      if (!active) return;
      const nextForm = formFromProfile(profile);
      setForm(nextForm);
      setCompletionPercentage(profile.completionPercentage);
      setProfileState(profile.state);
      setTaxonomy(options);
      setTaxonomyStatus("ready");
      const resume = profile.resumeSection;
      setSection(resume && WIZARD_SECTIONS.includes(resume)
        ? resume
        : firstIncompleteSection(nextForm));
    }).catch((error: unknown) => {
      if (!active) return;
      const detail = error instanceof Error ? error.message : "We could not load your profile.";
      if (detail.includes("Taxonomy") || detail.includes("NEXT_PUBLIC_API_URL")) {
        setTaxonomyStatus("error");
        setLoadError("We could not load the skill list. Check the API configuration and refresh.");
      } else {
        setLoadError(detail);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  function clearDebounce(): void {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = null;
  }

  function markChanged(next: ProfileFormState, changedSection: ProfileSection): void {
    dirty.current.add(changedSection);
    setForm(next);
    clearDebounce();
    debounce.current = setTimeout(() => {
      void save(next, changedSection, undefined, false);
    }, 700);
  }

  async function save(
    snapshot: ProfileFormState,
    savedSection: ProfileSection,
    resumeSection?: ProfileSection,
    announce = true,
  ): Promise<boolean> {
    const candidate: ProfileDraftInput = {
      ...(dirty.current.has(savedSection) ? sectionPatch(savedSection, snapshot) : {}),
      ...(resumeSection ? { resumeSection } : {}),
    };
    const parsed = profileDraftSchema.safeParse(candidate);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        nextErrors[fieldId(issue.path)] ??= issue.message;
      }
      setErrors(nextErrors);
      setMessageError(true);
      setMessage(parsed.error.issues[0]?.message ?? "Check the highlighted field before saving.");
      return false;
    }

    setErrors({});
    setSaving(true);
    setMessageError(false);
    const task = saveQueue.current.then(async () => {
      const response = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const saved = await response.json() as ProfileResponse;
      if (typeof saved.completionPercentage !== "number") {
        throw new Error("The saved profile response did not include progress.");
      }
      setCompletionPercentage(saved.completionPercentage);
      setProfileState(saved.state);
    });
    saveQueue.current = task.catch(() => undefined);
    try {
      await task;
      if (announce) setMessage("Draft saved.");
      return true;
    } catch (error) {
      setMessageError(true);
      setMessage(error instanceof Error ? error.message : "We could not save your profile. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveCurrent(): Promise<void> {
    clearDebounce();
    await save(form, section, undefined, true);
  }

  async function submitProfile(): Promise<void> {
    clearDebounce();
    setSaving(true);
    setMessageError(false);
    try {
      const response = await fetch("/api/v1/profiles/me/submit", { method: "POST" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const submitted = await response.json() as ProfileResponse;
      setProfileState(submitted.state);
      setCompletionPercentage(submitted.completionPercentage);
      setMessage("Profile submitted for review.");
    } catch (error) {
      setMessageError(true);
      setMessage(error instanceof Error ? error.message : "We could not submit your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function previousSection(): ProfileSection | undefined {
    const index = WIZARD_SECTIONS.indexOf(section);
    return index > 0 ? WIZARD_SECTIONS[index - 1] : undefined;
  }

  function nextIncompleteSection(): ProfileSection | undefined {
    const currentIndex = WIZARD_SECTIONS.indexOf(section);
    return WIZARD_SECTIONS.slice(currentIndex + 1).find((item) => !complete(item, form));
  }

  async function saveAndContinue(): Promise<void> {
    clearDebounce();
    const nextSection = nextIncompleteSection();
    if (!nextSection) {
      await saveCurrent();
      return;
    }
    if (await save(form, section, nextSection, false)) setSection(nextSection);
  }

  async function navigate(nextSection: ProfileSection): Promise<void> {
    if (nextSection === section) return;
    clearDebounce();
    if (await save(form, section, nextSection, false)) {
      setMessage("");
      setSection(nextSection);
    }
  }

  function updatePersonal(field: keyof ProfileFormState["personal"], value: string): void {
    markChanged({ ...form, personal: { ...form.personal, [field]: value } }, ProfileSection.PERSONAL);
  }

  function updateEducation(index: number, field: keyof EducationForm, value: string): void {
    const entries = form.education.map((entry, item) => item === index ? { ...entry, [field]: value } : entry);
    markChanged({ ...form, education: entries }, ProfileSection.EDUCATION);
  }

  function updateSkill(index: number, field: keyof SkillForm, value: string): void {
    const entries = form.skills.map((entry, item) => item === index ? { ...entry, [field]: value } : entry);
    markChanged({ ...form, skills: entries }, ProfileSection.SKILLS);
  }

  function updateLanguage(index: number, field: keyof LanguageForm, value: string): void {
    const entries = form.languages.map((entry, item) => item === index ? { ...entry, [field]: value } : entry);
    markChanged({ ...form, languages: entries }, ProfileSection.LANGUAGES);
  }

  function updateExperience(index: number, field: keyof ExperienceEntryForm, value: string | boolean): void {
    const entries = form.experience.entries.map((entry, item) => item === index ? { ...entry, [field]: value } : entry);
    markChanged({ ...form, experience: { ...form.experience, entries } }, ProfileSection.EXPERIENCE);
  }

  function updateSample(index: number, field: keyof SampleForm, value: string): void {
    const entries = form.samples.map((entry, item) => item === index ? { ...entry, [field]: value } : entry);
    markChanged({ ...form, samples: entries }, ProfileSection.SAMPLES);
  }

  async function uploadSample(index: number, event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    clearDebounce();
    const request = profileSampleUploadRequestSchema.safeParse({
      contentType: file.type,
      size: file.size,
    });
    const errorId = `profile-sample-${index}-file`;
    if (!request.success) {
      setErrors((current) => ({ ...current, [errorId]: file.size > 10 * 1024 * 1024
        ? "This file is larger than 10 MiB."
        : "Choose a PDF, JPEG, PNG or WebP file." }));
      return;
    }

    setErrors((current) => { const next = { ...current }; delete next[errorId]; return next; });
    setSaving(true);
    setMessageError(false);
    try {
      const credentialResponse = await fetch("/api/v1/profiles/me/samples/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.data),
      });
      if (!credentialResponse.ok) throw new Error(await responseMessage(credentialResponse));
      const credential = profileSampleUploadResponseSchema.safeParse(await credentialResponse.json());
      if (!credential.success) throw new Error("The upload authorization response was invalid.");

      const uploadResponse = await fetch(credential.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("The sample upload failed.");

      const nextForm = {
        ...form,
        samples: form.samples.map((entry, item) => item === index
          ? { ...entry, objectKey: credential.data.objectKey, uploadedAt: new Date().toISOString(), fileName: file.name }
          : entry),
      };
      dirty.current.add(ProfileSection.SAMPLES);
      setForm(nextForm);
      await save(nextForm, ProfileSection.SAMPLES, undefined, true);
    } catch (error) {
      setMessageError(true);
      setMessage(error instanceof Error ? error.message : "The sample upload failed.");
    } finally {
      setSaving(false);
    }
  }

  function input(
    label: string,
    id: string,
    value: string,
    onChange: (value: string) => void,
    options: { type?: string; help?: string; inputMode?: "numeric"; min?: number; max?: number } = {},
  ): ReactNode {
    const error = errors[id];
    return (
      <div className="company-onboarding-field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type={options.type ?? "text"}
          inputMode={options.inputMode}
          min={options.min}
          max={options.max}
          value={value}
          disabled={saving || profileState === ProfileState.SUBMITTED || profileState === ProfileState.UNDER_REVIEW || profileState === ProfileState.TEST_PENDING || profileState === ProfileState.TEST_PASSED || profileState === ProfileState.APPROVED || profileState === ProfileState.REJECTED}
          aria-invalid={error ? true : undefined}
          aria-describedby={[options.help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {options.help ? <p id={`${id}-help`} className="company-onboarding-help">{options.help}</p> : null}
        {error ? <p id={`${id}-error`} className="company-onboarding-error" role="alert">{error}</p> : null}
      </div>
    );
  }

  function select(
    label: string,
    id: string,
    value: string,
    onChange: (value: string) => void,
    options: readonly { value: string; label: string; disabled?: boolean }[],
  ): ReactNode {
    const error = errors[id];
    return (
      <div className="company-onboarding-field">
        <label htmlFor={id}>{label}</label>
        <select id={id} value={value} disabled={saving || profileState !== ProfileState.DRAFT && profileState !== ProfileState.MORE_INFO_NEEDED} aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose an option</option>
          {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
        {error ? <p id={`${id}-error`} className="company-onboarding-error" role="alert">{error}</p> : null}
      </div>
    );
  }

  function addRow(target: "education" | "skills" | "languages" | "experience" | "samples"): void {
    if (target === "education") markChanged({ ...form, education: [...form.education, { ...EMPTY_EDUCATION }] }, ProfileSection.EDUCATION);
    if (target === "skills") markChanged({ ...form, skills: [...form.skills, { ...EMPTY_SKILL }] }, ProfileSection.SKILLS);
    if (target === "languages") markChanged({ ...form, languages: [...form.languages, { ...EMPTY_LANGUAGE }] }, ProfileSection.LANGUAGES);
    if (target === "experience") markChanged({ ...form, experience: { ...form.experience, entries: [...form.experience.entries, { ...EMPTY_EXPERIENCE }] } }, ProfileSection.EXPERIENCE);
    if (target === "samples") markChanged({ ...form, samples: [...form.samples, { ...EMPTY_SAMPLE }] }, ProfileSection.SAMPLES);
  }

  function sectionContent(): ReactNode {
    if (section === ProfileSection.PERSONAL) return <>
      {input("First name", "profile-personal-firstName", form.personal.firstName, (value) => updatePersonal("firstName", value))}
      {input("Last name", "profile-personal-lastName", form.personal.lastName, (value) => updatePersonal("lastName", value))}
      {input("Professional headline (optional)", "profile-personal-headline", form.personal.headline, (value) => updatePersonal("headline", value))}
      {input("City (optional)", "profile-personal-city", form.personal.city, (value) => updatePersonal("city", value))}
    </>;
    if (section === ProfileSection.EDUCATION) return <>
      {form.education.map((entry, index) => <fieldset className="company-onboarding-subsection" key={index}>
        <legend>Education {index + 1}</legend>
        {input("School or university", `profile-education-${index}-institution`, entry.institution, (value) => updateEducation(index, "institution", value))}
        {input("Qualification", `profile-education-${index}-qualification`, entry.qualification, (value) => updateEducation(index, "qualification", value))}
        {input("Area of study", `profile-education-${index}-fieldOfStudy`, entry.fieldOfStudy, (value) => updateEducation(index, "fieldOfStudy", value))}
        {input("Start year", `profile-education-${index}-startYear`, entry.startYear, (value) => updateEducation(index, "startYear", value), { type: "number", inputMode: "numeric", min: 1900, max: new Date().getUTCFullYear() + 10 })}
        {input("End year (optional)", `profile-education-${index}-endYear`, entry.endYear, (value) => updateEducation(index, "endYear", value), { type: "number", inputMode: "numeric", min: 1900, max: new Date().getUTCFullYear() + 10 })}
      </fieldset>)}
      <GlassButton type="button" variant="secondary" onClick={() => addRow("education")}>Add education</GlassButton>
    </>;
    if (section === ProfileSection.SKILLS) return <>
      {taxonomyStatus === "error" ? <p role="alert">The skill list is unavailable. Refresh and try again.</p> : null}
      {form.skills.map((entry, index) => {
        const unavailable = entry.taxonomySlug && !activeTaxonomySlugs.has(entry.taxonomySlug)
          ? [{ value: entry.taxonomySlug, label: "Previously selected skill (no longer available)", disabled: true }]
          : [];
        return <fieldset className="company-onboarding-subsection" key={index}>
          <legend>Skill {index + 1}</legend>
          {select(`Skill ${index + 1}`, `profile-skill-${index}-taxonomySlug`, entry.taxonomySlug, (value) => updateSkill(index, "taxonomySlug", value), [
            ...taxonomy.map((option) => ({ value: option.slug, label: taxonomyLabel(option) })),
            ...unavailable,
          ])}
          {select(`Level ${index + 1}`, `profile-skill-${index}-level`, entry.level, (value) => updateSkill(index, "level", value), [
            { value: "BEGINNER", label: "Beginner" },
            { value: "INTERMEDIATE", label: "Intermediate" },
            { value: "ADVANCED", label: "Advanced" },
            { value: "EXPERT", label: "Expert" },
          ])}
        </fieldset>;
      })}
      <GlassButton type="button" variant="secondary" onClick={() => addRow("skills")}>Add skill</GlassButton>
    </>;
    if (section === ProfileSection.LANGUAGES) return <>
      <p className="company-onboarding-help">Use a BCP 47 language tag such as en, en-GB, or hi. Use a hyphen, not an underscore.</p>
      {form.languages.map((entry, index) => <fieldset className="company-onboarding-subsection" key={index}>
        <legend>Language {index + 1}</legend>
        {input(`Language tag ${index + 1}`, `profile-language-${index}-languageCode`, entry.languageCode, (value) => updateLanguage(index, "languageCode", value), { help: "Examples: en, en-GB, hi." })}
        {select(`Proficiency ${index + 1}`, `profile-language-${index}-proficiency`, entry.proficiency, (value) => updateLanguage(index, "proficiency", value), [
          { value: "BASIC", label: "Basic" },
          { value: "CONVERSATIONAL", label: "Conversational" },
          { value: "PROFESSIONAL", label: "Professional" },
          { value: "NATIVE", label: "Native" },
        ])}
      </fieldset>)}
      <GlassButton type="button" variant="secondary" onClick={() => addRow("languages")}>Add language</GlassButton>
    </>;
    if (section === ProfileSection.EXPERIENCE) return <>
      {input("Total experience in months", "profile-experience-totalMonths", form.experience.totalMonths, (value) => markChanged({ ...form, experience: { ...form.experience, totalMonths: value } }, ProfileSection.EXPERIENCE), { type: "number", inputMode: "numeric", min: 0, max: 960 })}
      {form.experience.entries.map((entry, index) => <fieldset className="company-onboarding-subsection" key={index}>
        <legend>Experience {index + 1}</legend>
        {input("Company", `profile-experience-${index}-organization`, entry.organization, (value) => updateExperience(index, "organization", value))}
        {input("Job title", `profile-experience-${index}-title`, entry.title, (value) => updateExperience(index, "title", value))}
        {input("Start month", `profile-experience-${index}-startDate`, entry.startDate.slice(0, 7), (value) => updateExperience(index, "startDate", value ? `${value}-01` : ""), { type: "month" })}
        {!entry.currentlyWorks ? input("End month", `profile-experience-${index}-endDate`, entry.endDate.slice(0, 7), (value) => updateExperience(index, "endDate", value ? `${value}-01` : ""), { type: "month" }) : null}
        <label className="profile-current-work"><input type="checkbox" checked={entry.currentlyWorks} disabled={saving || !editable} onChange={(event) => { const currentlyWorks = event.target.checked; const entries = form.experience.entries.map((item, itemIndex) => itemIndex === index ? { ...item, currentlyWorks, endDate: currentlyWorks ? "" : item.endDate } : item); markChanged({ ...form, experience: { ...form.experience, entries } }, ProfileSection.EXPERIENCE); }} /> I currently work here</label>
        {input("What you did (optional)", `profile-experience-${index}-summary`, entry.summary, (value) => updateExperience(index, "summary", value))}
      </fieldset>)}
      <GlassButton type="button" variant="secondary" onClick={() => addRow("experience")}>Add experience</GlassButton>
    </>;
    if (section === ProfileSection.SAMPLES) return <>
      <p className="company-onboarding-help">Add references to work samples stored through the profile storage flow.</p>
      {form.samples.map((entry, index) => <fieldset className="company-onboarding-subsection" key={index}>
        <legend>Sample {index + 1}</legend>
        {input(`Sample title ${index + 1}`, `profile-sample-${index}-title`, entry.title, (value) => updateSample(index, "title", value))}
        <div className="company-onboarding-field">
          <label htmlFor={`profile-sample-${index}-file`}>Upload sample file {index + 1}</label>
          <input id={`profile-sample-${index}-file`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={saving || profileState !== ProfileState.DRAFT && profileState !== ProfileState.MORE_INFO_NEEDED} onChange={(event) => void uploadSample(index, event)} aria-invalid={errors[`profile-sample-${index}-file`] ? true : undefined} />
          {entry.objectKey ? <p className="company-onboarding-help">{entry.fileName || "Sample file uploaded."}</p> : null}
          {errors[`profile-sample-${index}-file`] ? <p className="company-onboarding-error" role="alert">{errors[`profile-sample-${index}-file`]}</p> : null}
        </div>
      </fieldset>)}
      <GlassButton type="button" variant="secondary" onClick={() => addRow("samples")}>Add sample</GlassButton>
    </>;
    if (section === ProfileSection.AVAILABILITY) return <>
      {input("Available from", "profile-availability-availableFrom", form.availability.availableFrom, (value) => markChanged({ ...form, availability: { ...form.availability, availableFrom: value } }, ProfileSection.AVAILABILITY), { type: "date" })}
      {input("Weekly hours", "profile-availability-weeklyHours", form.availability.weeklyHours, (value) => markChanged({ ...form, availability: { ...form.availability, weeklyHours: value } }, ProfileSection.AVAILABILITY), { type: "number", inputMode: "numeric", min: 1, max: 168 })}
      {input("IANA time zone", "profile-availability-timeZone", form.availability.timeZone, (value) => markChanged({ ...form, availability: { ...form.availability, timeZone: value } }, ProfileSection.AVAILABILITY), { help: "Example: Asia/Kolkata or Europe/London." })}
    </>;
    return <>
      <div className="profile-rate-input"><span aria-hidden="true">{({ INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$" } as Record<string, string>)[form.rate.currencyCode] ?? "¤"}</span>{input("Your rate", "profile-rate-amountMinor", form.rate.amountMinor, (value) => markChanged({ ...form, rate: { ...form.rate, amountMinor: value } }, ProfileSection.RATE), { type: "number", inputMode: "numeric", min: 0.01, help: "Enter what you want to earn before platform fees." })}</div>
      {select("Currency", "profile-rate-currencyCode", form.rate.currencyCode, (value) => markChanged({ ...form, rate: { ...form.rate, currencyCode: value, amountMinor: rateInput(Number(form.rate.amountMinor) * (form.rate.currencyCode === "JPY" ? 1 : 100), value) } }, ProfileSection.RATE), ["INR", "USD", "EUR", "GBP", "SGD"].map((value) => ({ value, label: value })))}
      {select("Per", "profile-rate-unit", form.rate.unit, (value) => markChanged({ ...form, rate: { ...form.rate, unit: value } }, ProfileSection.RATE), [{ value: "HOUR", label: "Hour" }])}
    </>;
  }

  if (loading) return <p className="authenticated-shell-status">Loading your profile…</p>;
  if (loadError) return <p className="authenticated-shell-status" role="alert">{loadError}</p>;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void saveCurrent();
  }

  const editable = profileState === ProfileState.DRAFT || profileState === ProfileState.MORE_INFO_NEEDED;

  return (
    <FrostedSurface className="company-onboarding-shell" variant="panel" aria-labelledby="profile-wizard-title">
      <p className="home-eyebrow">Freelancer profile</p>
      <h1 id="profile-wizard-title">Build your profile</h1>
      <p className="company-onboarding-copy">Save each section as you go. You can return and continue later.</p>
      <p className="company-onboarding-help" role="status" aria-live="polite">{completionPercentage}% complete</p>
      <p className="company-onboarding-help" role="status" aria-live="polite">State: {profileState.replaceAll("_", " ")}</p>
      <nav className="company-onboarding-stepper" aria-label="Profile sections">
        <ol>{WIZARD_SECTIONS.map((item) => <li key={item}>
            <button type="button" disabled={saving || !editable} data-current={section === item} aria-current={section === item ? "step" : undefined} onClick={() => void navigate(item)}>
            {SECTION_LABELS[item]}
          </button>
        </li>)}</ol>
      </nav>
      <form className="company-onboarding-form" noValidate onSubmit={submit}>
        <section aria-labelledby="profile-section-title">
          <h2 id="profile-section-title" className="home-section-title">{SECTION_LABELS[section]}</h2>
          {sectionContent()}
          {editable ? <div className="company-onboarding-actions">
            {previousSection() ? <GlassButton type="button" variant="secondary" disabled={saving} onClick={() => void navigate(previousSection()!)}>Back</GlassButton> : null}
            <GlassButton type="button" variant="secondary" disabled={saving} onClick={() => void saveCurrent()}>{saving ? "Saving…" : "Save draft"}</GlassButton>
            <GlassButton type="button" variant="primary" disabled={saving} onClick={() => void saveAndContinue()}>{saving ? "Saving…" : "Save and continue"}</GlassButton>
            {completionPercentage === 100 ? <GlassButton type="button" variant="primary" disabled={saving} onClick={() => void submitProfile()}>Submit profile for review</GlassButton> : null}
          </div> : null}
        </section>
        <p
          className={messageError ? "company-onboarding-error" : "profile-wizard-success"}
          role={messageError && Object.keys(errors).length === 0 ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      </form>
    </FrostedSurface>
  );
}
