"use client";

import {
  authSessionSchema,
  CLIENT_UPLOAD_CONTENT_TYPES,
  CLIENT_UPLOAD_MAX_BYTES,
  clientDraftSchema,
  clientUploadRequestSchema,
  clientUploadResponseSchema,
  getCompanyCountryRequirements,
  getVendorCountryRequirements,
  otpRequestSchema,
  otpVerifySchema,
  registrationRequestAcceptedSchema,
  registrationRequestSchema,
  registrationVerifySchema,
  VENDOR_UPLOAD_CONTENT_TYPES,
  VENDOR_UPLOAD_MAX_BYTES,
  vendorDraftSchema,
  vendorUploadRequestSchema,
  vendorUploadResponseSchema,
  type AuthSession,
  type ClientDraftInput,
  type RegistrationRequest,
  type VendorDraftInput,
} from "@eqourse/shared";
import { GlassButton, FrostedSurface } from "@eqourse/ui";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { createCountryOptions, type CountryOption } from "../../app/register/country-codes";
import { publicApiUrl } from "../../lib/public-api-url";
import { companyActorConfig, type CompanyActor } from "./company-onboarding-config";

type StepId = "company" | "address" | "contact" | "identifiers" | "capabilities" | "review";

const STEPS: readonly { id: StepId; label: string }[] = [
  { id: "company", label: "Company" },
  { id: "address", label: "Address" },
  { id: "contact", label: "Contact" },
  { id: "identifiers", label: "Identifiers" },
  { id: "capabilities", label: "Capabilities" },
  { id: "review", label: "Review" },
];

const SUBMISSION_REQUIREMENT_COPY: Readonly<Record<string, {
  instruction: string;
  label: string;
  sectionId: string;
  step: StepId;
}>> = {
  business_details: {
    label: "Business details",
    instruction: "enter your company, registered address, and contact information",
    step: "company",
    sectionId: "company-section-title",
  },
  bank_details: {
    label: "Bank details",
    instruction: "enter the account holder, bank country, currency, and account identifier",
    step: "company",
    sectionId: "company-section-title",
  },
  country_requirements: {
    label: "Country requirements",
    instruction: "choose a supported country for this registration",
    step: "company",
    sectionId: "company-section-title",
  },
  country_identifiers: {
    label: "Identifiers",
    instruction: "enter every identifier required for your country",
    step: "identifiers",
    sectionId: "identifiers-section-title",
  },
  documents: {
    label: "Required documents",
    instruction: "upload every document required for your country",
    step: "identifiers",
    sectionId: "identifiers-section-title",
  },
  capabilities: {
    label: "Capabilities",
    instruction: "select at least one service you can deliver",
    step: "capabilities",
    sectionId: "capabilities-section-title",
  },
  authorised_person: {
    label: "Authorised person",
    instruction: "enter the authorised person's name and upload their government identity document",
    step: "company",
    sectionId: "company-authorised-person",
  },
};

// Derive every possible draft issue path from the shared contracts. Arrays use []
// as the path segment, matching the normalized numeric index at runtime.
type ChildPaths<T> = T extends Date ? never
  : T extends readonly (infer Item)[] ? "[]" | `[]${ChildPaths<Item>}`
    : T extends object ? {
      [Key in keyof T & string]: `.${Key}` | `.${Key}${ChildPaths<NonNullable<T[Key]>>}`
    }[keyof T & string]
      : never;
type DraftPaths<T> = T extends unknown ? {
  [Key in keyof T & string]: Key | `${Key}${ChildPaths<NonNullable<T[Key]>>}`
}[keyof T & string] : never;
type SchemaIssuePath = DraftPaths<ClientDraftInput> | DraftPaths<VendorDraftInput>;

const SCHEMA_FIELD_IDS: Readonly<Record<string, string>> & Readonly<Record<SchemaIssuePath, string>> = {
  legalName: "legalName",
  tradingName: "tradingName",
  countryCode: "countryCode",
  registeredAddress: "addressLine1",
  "registeredAddress.line1": "addressLine1",
  "registeredAddress.line2": "addressLine2",
  "registeredAddress.city": "addressCity",
  "registeredAddress.region": "addressRegion",
  "registeredAddress.postalCode": "addressPostalCode",
  "registeredAddress.countryCode": "countryCode",
  contactPerson: "contactName",
  "contactPerson.name": "contactName",
  "contactPerson.email": "contactEmail",
  "contactPerson.phone": "contactPhone",
  website: "website",
  authorisedPerson: "authorisedPersonName",
  "authorisedPerson.name": "authorisedPersonName",
  "authorisedPerson.governmentIdentityDocument": "authorisedPersonName",
  "authorisedPerson.governmentIdentityDocument.kind": "authorisedPersonName",
  "authorisedPerson.governmentIdentityDocument.objectKey": "authorisedPersonName",
  "authorisedPerson.governmentIdentityDocument.uploadedAt": "authorisedPersonName",
  countryIdentifiers: "countryCode",
  "countryIdentifiers[]": "countryCode",
  "countryIdentifiers[].scheme": "countryCode",
  "countryIdentifiers[].value": "countryCode",
  documents: "countryCode",
  "documents[]": "countryCode",
  "documents[].kind": "countryCode",
  "documents[].objectKey": "countryCode",
  "documents[].uploadedAt": "countryCode",
  capabilities: "countryCode",
  "capabilities[]": "countryCode",
  "capabilities[].taxonomySlug": "countryCode",
  bankDetails: "bankAccountHolderName",
  "bankDetails.accountHolderName": "bankAccountHolderName",
  "bankDetails.bankCountryCode": "bankCountryCode",
  "bankDetails.currencyCode": "bankCurrencyCode",
  "bankDetails.accountIdentifier": "bankAccountValue",
  "bankDetails.accountIdentifier.scheme": "bankAccountScheme",
  "bankDetails.accountIdentifier.value": "bankAccountValue",
  "bankDetails.bankIdentifier": "bankAccountValue",
  "bankDetails.bankIdentifier.scheme": "bankAccountScheme",
  "bankDetails.bankIdentifier.value": "bankAccountValue",
} satisfies Readonly<Record<SchemaIssuePath, string>>;

export function schemaIssueField(path: string): string {
  const directPath = path.replace(/\.\d+(?=\.|$)/g, "[]");
  if (SCHEMA_FIELD_IDS[directPath]) return SCHEMA_FIELD_IDS[directPath];
  if (path.startsWith("registeredAddress.")) return "addressLine1";
  if (path.startsWith("contactPerson.")) return "contactName";
  if (path.startsWith("authorisedPerson.")) return "authorisedPersonName";
  if (path.startsWith("countryIdentifiers") || path.startsWith("documents")) return "countryCode";
  if (path.startsWith("bankDetails.")) return "bankAccountHolderName";
  if (path.startsWith("website")) return "website";
  return "legalName";
}

function stepForField(fieldId: string): StepId {
  if (fieldId.startsWith("address")) return "address";
  if (fieldId.startsWith("contact")) return "contact";
  if (fieldId.startsWith("identifier")) return "identifiers";
  if (fieldId === "capabilitySlugs") return "capabilities";
  return "company";
}

interface CompanyOnboardingFormProps {
  actor?: CompanyActor;
  guest?: boolean;
  onAuthenticated?: (session: AuthSession) => void;
}

interface SkillTaxonomyOption {
  businessUnit: string;
  serviceLine: string;
  skill: string;
  specialization: string | null;
  slug: string;
}

type TaxonomyStatus = "loading" | "ready" | "error";

type AccessStep =
  | "details"
  | "verification"
  | "existing-account"
  | "signin-verification";

interface CompanyFormState {
  addressCity: string;
  addressCountryCode: string;
  addressLine1: string;
  addressLine2: string;
  addressPostalCode: string;
  addressRegion: string;
  bankAccountHolderName: string;
  bankAccountScheme: string;
  bankAccountValue: string;
  bankCountryCode: string;
  bankCurrencyCode: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  countryCode: string;
  legalName: string;
  tradingName: string;
  website: string;
  authorisedPersonName: string;
  governmentIdentityDocumentKind: string;
  governmentIdentityDocument?: {
    kind: string;
    objectKey: string;
    uploadedAt: string;
  };
  capabilitySlugs: string;
  identifiers: Record<string, string>;
  documents: Record<string, { objectKey: string; uploadedAt: string }>;
}

type DocumentUploadState = {
  status: "idle" | "uploading" | "uploaded" | "failed";
  name?: string;
  message: string;
};

const EMPTY_FORM: CompanyFormState = {
  addressCity: "",
  addressCountryCode: "",
  addressLine1: "",
  addressLine2: "",
  addressPostalCode: "",
  addressRegion: "",
  bankAccountHolderName: "",
  bankAccountScheme: "ACCOUNT",
  bankAccountValue: "",
  bankCountryCode: "",
  bankCurrencyCode: "",
  contactEmail: "",
  contactName: "",
  contactPhone: "",
  countryCode: "",
  legalName: "",
  tradingName: "",
  website: "",
  authorisedPersonName: "",
  governmentIdentityDocumentKind: "PASSPORT",
  capabilitySlugs: "",
  identifiers: {},
  documents: {},
};

const SCHEME_LABELS: Readonly<Record<string, string>> = {
  COMPANY_PAN: "Company PAN",
  CN_USCC: "Unified social credit code",
  COMPANIES_HOUSE: "Companies House number",
  EIN: "EIN",
  EU_VAT: "EU VAT",
  GSTIN: "GSTIN",
  INCORPORATION_NUMBER: "Incorporation number",
  TAX_ID: "Tax ID",
  UDYAM: "Udyam",
  UEN: "UEN",
  VAT: "VAT number",
};

function labelForScheme(scheme: string): string {
  return SCHEME_LABELS[scheme] ?? scheme;
}

function labelForDocument(kind: string): string {
  return kind
    .toLowerCase()
    .split("_")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function nonEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function completeAddress(form: CompanyFormState): NonNullable<
  VendorDraftInput["registeredAddress"]
> | undefined {
  const line1 = nonEmpty(form.addressLine1);
  const city = nonEmpty(form.addressCity);
  const postalCode = nonEmpty(form.addressPostalCode);
  const countryCode = nonEmpty(form.addressCountryCode);
  if (!line1 || !city || !postalCode || !countryCode) return undefined;
  const line2 = nonEmpty(form.addressLine2);
  const region = nonEmpty(form.addressRegion);
  return {
    line1,
    ...(line2 ? { line2 } : {}),
    city,
    ...(region ? { region } : {}),
    postalCode,
    countryCode,
  };
}

type CompanyDraftInput = VendorDraftInput | ClientDraftInput;

function requirementsForActor(actor: CompanyActor, countryCode: string) {
  return actor === "client"
    ? getCompanyCountryRequirements(countryCode)
    : getVendorCountryRequirements(countryCode);
}

function completeContact(form: CompanyFormState): NonNullable<
  VendorDraftInput["contactPerson"]
> | undefined {
  const name = nonEmpty(form.contactName);
  const email = nonEmpty(form.contactEmail);
  const phone = nonEmpty(form.contactPhone);
  return name && email && phone ? { name, email, phone } : undefined;
}

function completeBankDetails(form: CompanyFormState): NonNullable<
  VendorDraftInput["bankDetails"]
> | undefined {
  const accountHolderName = nonEmpty(form.bankAccountHolderName);
  const accountValue = nonEmpty(form.bankAccountValue);
  const bankCountryCode = nonEmpty(form.bankCountryCode);
  const currencyCode = nonEmpty(form.bankCurrencyCode);
  if (!accountHolderName || !accountValue || !bankCountryCode || !currencyCode) return undefined;
  return {
    accountHolderName,
    bankCountryCode,
    currencyCode,
    accountIdentifier: {
      scheme: nonEmpty(form.bankAccountScheme) ?? "ACCOUNT",
      value: accountValue,
    },
  };
}

function toCompanyPayload(form: CompanyFormState, actor: CompanyActor): CompanyDraftInput {
  const config = companyActorConfig[actor];
  const capabilities = form.capabilitySlugs
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((taxonomySlug) => ({ taxonomySlug }));
  const address = completeAddress(form);
  const contact = completeContact(form);
  const bankDetails = completeBankDetails(form);
  const countryIdentifiers = Object.entries(form.identifiers)
    .filter(([, value]) => value.trim())
    .map(([scheme, value]) => ({ scheme, value }));
  const documents = Object.entries(form.documents).map(([kind, document]) => ({
    kind,
    objectKey: document.objectKey,
    uploadedAt: new Date(document.uploadedAt),
  }));

  return {
    ...(nonEmpty(form.legalName) ? { legalName: nonEmpty(form.legalName) } : {}),
    ...(nonEmpty(form.tradingName) ? { tradingName: nonEmpty(form.tradingName) } : {}),
    ...(nonEmpty(form.countryCode) ? { countryCode: nonEmpty(form.countryCode) } : {}),
    ...(address ? { registeredAddress: address } : {}),
    ...(contact ? { contactPerson: contact } : {}),
    ...(config.website && nonEmpty(form.website) ? { website: nonEmpty(form.website) } : {}),
    ...(config.authorisedPerson && nonEmpty(form.authorisedPersonName)
      ? {
          authorisedPerson: {
            name: nonEmpty(form.authorisedPersonName)!,
            ...(form.governmentIdentityDocument
              ? {
                  governmentIdentityDocument: {
                    ...form.governmentIdentityDocument,
                    uploadedAt: new Date(form.governmentIdentityDocument.uploadedAt),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(config.capabilities && capabilities.length > 0 ? { capabilities } : {}),
    ...(countryIdentifiers.length > 0 ? { countryIdentifiers } : {}),
    ...(config.bankDetails && bankDetails ? { bankDetails } : {}),
    ...(documents.length > 0 ? { documents } : {}),
  };
}

function formFromDraft(draft: Record<string, unknown>): CompanyFormState {
  const address = (draft.registeredAddress ?? {}) as Record<string, unknown>;
  const contact = (draft.contactPerson ?? {}) as Record<string, unknown>;
  const bank = (draft.bankDetails ?? {}) as Record<string, unknown>;
  const account = (bank.accountIdentifier ?? {}) as Record<string, unknown>;
  const authorisedPerson = (draft.authorisedPerson ?? {}) as Record<string, unknown>;
  const governmentIdentityDocument = (
    authorisedPerson.governmentIdentityDocument ?? {}
  ) as Record<string, unknown>;
  const identifiers = Array.isArray(draft.countryIdentifiers)
    ? Object.fromEntries(draft.countryIdentifiers.flatMap((entry) => {
        const item = entry as Record<string, unknown>;
        return typeof item.scheme === "string" && typeof item.value === "string"
          ? [[item.scheme, item.value]]
          : [];
      }))
    : {};
  const documents = Array.isArray(draft.documents)
    ? Object.fromEntries(draft.documents.flatMap((entry) => {
        const item = entry as Record<string, unknown>;
        return typeof item.kind === "string" && typeof item.objectKey === "string"
          ? [[item.kind, {
              objectKey: item.objectKey,
              uploadedAt: typeof item.uploadedAt === "string" ? item.uploadedAt : new Date().toISOString(),
            }]]
          : [];
      }))
    : {};
  const capabilities = Array.isArray(draft.capabilities)
    ? draft.capabilities
        .map((entry) => (entry as Record<string, unknown>).taxonomySlug)
        .filter((slug): slug is string => typeof slug === "string")
        .join(", ")
    : "";

  return {
    ...EMPTY_FORM,
    legalName: typeof draft.legalName === "string" ? draft.legalName : "",
    tradingName: typeof draft.tradingName === "string" ? draft.tradingName : "",
    countryCode: typeof draft.countryCode === "string" ? draft.countryCode : "",
    addressLine1: typeof address.line1 === "string" ? address.line1 : "",
    addressLine2: typeof address.line2 === "string" ? address.line2 : "",
    addressCity: typeof address.city === "string" ? address.city : "",
    addressRegion: typeof address.region === "string" ? address.region : "",
    addressPostalCode: typeof address.postalCode === "string" ? address.postalCode : "",
    addressCountryCode: typeof address.countryCode === "string"
      ? address.countryCode
      : typeof draft.countryCode === "string" ? draft.countryCode : "",
    contactName: typeof contact.name === "string" ? contact.name : "",
    contactEmail: typeof contact.email === "string" ? contact.email : "",
    contactPhone: typeof contact.phone === "string" ? contact.phone : "",
    bankAccountHolderName: typeof bank.accountHolderName === "string" ? bank.accountHolderName : "",
    bankAccountScheme: typeof account.scheme === "string" ? account.scheme : "ACCOUNT",
    bankAccountValue: typeof account.value === "string" ? account.value : "",
    bankCountryCode: typeof bank.bankCountryCode === "string" ? bank.bankCountryCode : "",
    bankCurrencyCode: typeof bank.currencyCode === "string" ? bank.currencyCode : "",
    website: typeof draft.website === "string" ? draft.website : "",
    authorisedPersonName: typeof authorisedPerson.name === "string" ? authorisedPerson.name : "",
    governmentIdentityDocumentKind:
      typeof governmentIdentityDocument.kind === "string"
        ? governmentIdentityDocument.kind
        : "PASSPORT",
    governmentIdentityDocument:
      typeof governmentIdentityDocument.kind === "string"
      && typeof governmentIdentityDocument.objectKey === "string"
        ? {
            kind: governmentIdentityDocument.kind,
            objectKey: governmentIdentityDocument.objectKey,
            uploadedAt:
              typeof governmentIdentityDocument.uploadedAt === "string"
                ? governmentIdentityDocument.uploadedAt
                : new Date().toISOString(),
          }
        : undefined,
    identifiers,
    capabilitySlugs: capabilities,
    documents,
  };
}

function isComplete(step: StepId, form: CompanyFormState, actor: CompanyActor): boolean {
  if (step === "company") {
    const actorSpecificDetails = companyActorConfig[actor].bankDetails
      ? completeBankDetails(form)
      : companyActorConfig[actor].website
        ? nonEmpty(form.website) && nonEmpty(form.authorisedPersonName) && form.governmentIdentityDocument
        : true;
    return Boolean(nonEmpty(form.legalName) && nonEmpty(form.countryCode) && actorSpecificDetails);
  }
  if (step === "address") return Boolean(completeAddress(form));
  if (step === "contact") return Boolean(completeContact(form));
  if (step === "identifiers") {
    const requirements = form.countryCode
      ? requirementsForActor(actor, form.countryCode)
      : undefined;
    return Boolean(
      requirements
      && requirements.identifierSchemes.every((scheme) => nonEmpty(form.identifiers[scheme] ?? ""))
      && requirements.documentKinds.every((kind) => Boolean(form.documents[kind]?.objectKey)),
    );
  }
  if (step === "capabilities") {
    return !companyActorConfig[actor].capabilities || form.capabilitySlugs.split(",").some((slug) => Boolean(slug.trim()));
  }
  return false;
}

function firstIncompleteStep(form: CompanyFormState, actor: CompanyActor): StepId {
  for (const step of STEPS.slice(0, -1)) {
    if (!isComplete(step.id, form, actor)) return step.id;
  }
  return "review";
}

function firstIncompleteField(form: CompanyFormState, actor: CompanyActor): { step: StepId; id: string } {
  const step = firstIncompleteStep(form, actor);
  if (step === "company") {
    const id = !nonEmpty(form.legalName)
      ? "legalName"
      : !nonEmpty(form.countryCode)
        ? "countryCode"
        : companyActorConfig[actor].bankDetails
          ? "bankAccountHolderName"
          : !nonEmpty(form.website)
            ? "website"
            : !nonEmpty(form.authorisedPersonName)
              ? "authorisedPersonName"
              : "governmentIdentityDocument";
    return { step, id: `company-${id}` };
  }
  if (step === "address") return { step, id: "company-addressLine1" };
  if (step === "contact") return { step, id: "company-contactName" };
  if (step === "identifiers") {
    const requirements = form.countryCode
      ? requirementsForActor(actor, form.countryCode)
      : undefined;
    const missingScheme = requirements?.identifierSchemes.find((scheme) => !nonEmpty(form.identifiers[scheme] ?? ""));
    const missingDocument = requirements?.documentKinds.find((kind) => !form.documents[kind]?.objectKey);
    return { step, id: missingScheme ? `company-identifier-${missingScheme}` : missingDocument ? `company-document-${missingDocument}` : "identifiers-section-title" };
  }
  if (step === "capabilities") return { step, id: "company-capability-search" };
  return { step, id: "review-section-title" };
}

function submissionRequirementTarget(
  code: string,
  form: CompanyFormState,
  actor: CompanyActor,
): { id: string; sectionId: string; step: StepId } {
  const copy = SUBMISSION_REQUIREMENT_COPY[code];
  if (!copy) {
    return { step: "review", sectionId: "review-section-title", id: "review-section-title" };
  }

  if (code === "business_details") {
    if (!nonEmpty(form.legalName)) return { ...copy, id: "company-legalName" };
    if (!nonEmpty(form.countryCode)) return { ...copy, id: "company-countryCode" };
    if (!completeAddress(form)) {
      return {
        ...copy,
        step: "address",
        sectionId: "address-section-title",
        id: "company-addressLine1",
      };
    }
    if (!completeContact(form)) {
      return {
        ...copy,
        step: "contact",
        sectionId: "contact-section-title",
        id: "company-contactName",
      };
    }
    return { ...copy, id: copy.sectionId };
  }
  if (code === "bank_details") return { ...copy, id: "company-bankAccountHolderName" };
  if (code === "authorised_person") {
    return {
      ...copy,
      id: !nonEmpty(form.authorisedPersonName)
        ? "company-authorisedPersonName"
        : "company-governmentIdentityDocument",
    };
  }
  if (code === "country_requirements") return { ...copy, id: "company-countryCode" };
  if (code === "country_identifiers") {
    const requirements = form.countryCode
      ? requirementsForActor(actor, form.countryCode)
      : undefined;
    const scheme = requirements?.identifierSchemes.find(
      (candidate) => !nonEmpty(form.identifiers[candidate] ?? ""),
    );
    return { ...copy, id: scheme ? `company-identifier-${scheme}` : copy.sectionId };
  }
  if (code === "documents") {
    const requirements = form.countryCode
      ? requirementsForActor(actor, form.countryCode)
      : undefined;
    const kind = requirements?.documentKinds.find(
      (candidate) => !form.documents[candidate]?.objectKey,
    );
    return { ...copy, id: kind ? `company-document-${kind}` : copy.sectionId };
  }
  if (code === "capabilities") return { ...copy, id: "company-capability-search" };
  return { ...copy, id: copy.sectionId };
}

async function readSubmissionMissing(response: Response): Promise<string[]> {
  try {
    const body = await response.json() as { missing?: unknown };
    return Array.isArray(body.missing)
      ? body.missing.filter(
          (code): code is string => typeof code === "string" && code.length > 0,
        )
      : [];
  } catch {
    return [];
  }
}

function taxonomyLeaf(option: SkillTaxonomyOption): string {
  return option.specialization ?? option.skill;
}

async function requestSkillTaxonomy(): Promise<SkillTaxonomyOption[]> {
  const response = await fetch(publicApiUrl("/api/v1/skill-taxonomy"));
  if (!response.ok) throw new Error("Skill taxonomy request failed");
  const body = await response.json() as unknown;
  if (!Array.isArray(body)) throw new Error("Skill taxonomy response was not a list");
  return body.map((row) => {
    if (
      !row
      || typeof row !== "object"
      || typeof (row as Record<string, unknown>).businessUnit !== "string"
      || typeof (row as Record<string, unknown>).serviceLine !== "string"
      || typeof (row as Record<string, unknown>).skill !== "string"
      || !(
        typeof (row as Record<string, unknown>).specialization === "string"
        || (row as Record<string, unknown>).specialization === null
      )
      || typeof (row as Record<string, unknown>).slug !== "string"
    ) {
      throw new Error("Skill taxonomy response contained an invalid option");
    }
    return row as SkillTaxonomyOption;
  });
}

async function readDraft(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

export function CompanyOnboardingForm({ actor = "vendor", guest = false, onAuthenticated }: CompanyOnboardingFormProps) {
  const config = companyActorConfig[actor];
  const apiBase = `/api/v1/${actor}s`;
  const steps = config.capabilities
    ? STEPS
    : STEPS.filter((item) => item.id !== "capabilities");
  const draftSchema = actor === "client" ? clientDraftSchema : vendorDraftSchema;
  const uploadRequestSchema = actor === "client"
    ? clientUploadRequestSchema
    : vendorUploadRequestSchema;
  const uploadResponseSchema = actor === "client"
    ? clientUploadResponseSchema
    : vendorUploadResponseSchema;
  const uploadContentTypes = actor === "client"
    ? CLIENT_UPLOAD_CONTENT_TYPES
    : VENDOR_UPLOAD_CONTENT_TYPES;
  const uploadMaxBytes = actor === "client"
    ? CLIENT_UPLOAD_MAX_BYTES
    : VENDOR_UPLOAD_MAX_BYTES;
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [step, setStep] = useState<StepId>("company");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(!guest);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [messageError, setMessageError] = useState(false);
  const [submissionMissing, setSubmissionMissing] = useState<string[]>([]);
  const [taxonomyOptions, setTaxonomyOptions] = useState<SkillTaxonomyOption[]>([]);
  const [taxonomyStatus, setTaxonomyStatus] = useState<TaxonomyStatus>("loading");
  const [capabilitySearch, setCapabilitySearch] = useState("");
  const pendingFocus = useRef<string | null>(null);
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});
  const [documentUploads, setDocumentUploads] = useState<Record<string, DocumentUploadState>>({});
  const [identityDocumentName, setIdentityDocumentName] = useState("");
  const [identityDocumentUpload, setIdentityDocumentUpload] = useState<DocumentUploadState>({
    status: "idle",
    message: "No file uploaded.",
  });
  const [accessStep, setAccessStep] = useState<AccessStep | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPhone, setAccessPhone] = useState("");
  const [accessOtp, setAccessOtp] = useState("");
  const [accessIdentity, setAccessIdentity] = useState<Pick<RegistrationRequest, "email" | "phone"> | null>(null);
  const [accessErrors, setAccessErrors] = useState<Record<string, string>>({});
  const pendingSubmission = useRef(false);

  const selectedCapabilitySlugs = useMemo(
    () => new Set(form.capabilitySlugs.split(",").map((slug) => slug.trim()).filter(Boolean)),
    [form.capabilitySlugs],
  );
  const selectedCapabilities = useMemo(
    () => taxonomyOptions.filter((option) => selectedCapabilitySlugs.has(option.slug)),
    [selectedCapabilitySlugs, taxonomyOptions],
  );
  const groupedCapabilities = useMemo(() => {
    const query = capabilitySearch.trim().toLocaleLowerCase();
    const filtered = taxonomyOptions.filter((option) => !query || [
      option.businessUnit,
      option.serviceLine,
      option.skill,
      option.specialization ?? "",
    ].some((value) => value.toLocaleLowerCase().includes(query)));
    const groups = new Map<string, Map<string, SkillTaxonomyOption[]>>();
    for (const option of filtered) {
      const businessUnit = groups.get(option.businessUnit) ?? new Map();
      const serviceLine = businessUnit.get(option.serviceLine) ?? [];
      serviceLine.push(option);
      businessUnit.set(option.serviceLine, serviceLine);
      groups.set(option.businessUnit, businessUnit);
    }
    return Array.from(groups, ([businessUnit, serviceLines]) => ({
      businessUnit,
      serviceLines: Array.from(serviceLines, ([serviceLine, options]) => ({
        serviceLine,
        options,
      })),
    }));
  }, [capabilitySearch, taxonomyOptions]);

  useEffect(() => setCountryOptions(createCountryOptions()), []);

  useEffect(() => {
    if (!config.capabilities) {
      setTaxonomyStatus("ready");
      return;
    }
    let active = true;
    void requestSkillTaxonomy()
      .then((options) => {
        if (!active) return;
        setTaxonomyOptions(options);
        setTaxonomyStatus("ready");
      })
      .catch(() => {
        if (active) setTaxonomyStatus("error");
      });
    return () => {
      active = false;
    };
  }, [config.capabilities]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    const target = document.getElementById(pendingFocus.current);
    target?.focus();
    pendingFocus.current = null;
  }, [fieldErrors, message, step]);

  useEffect(() => {
    if (guest) return;
    let active = true;
    void fetch(`${apiBase}/me`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 404) {
          const created = await fetch(apiBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          if (!created.ok) throw new Error("Could not create draft");
          return readDraft(created);
        }
        if (!response.ok) throw new Error("Could not load draft");
        return readDraft(response);
      })
      .then((draft) => {
        if (!active) return;
        const nextForm = formFromDraft(draft);
        setForm(nextForm);
        setSubmitted(draft.state === "SUBMITTED" || draft.state === "UNDER_REVIEW");
        setStep(firstIncompleteStep(nextForm, actor));
        setDocumentNames(Object.fromEntries(Object.entries(nextForm.documents).map(([kind, document]) => [kind, document.objectKey])));
        setDocumentUploads(Object.fromEntries(Object.keys(nextForm.documents).map((kind) => [kind, {
          status: "uploaded" as const,
          message: "Uploaded. Choose another file to replace it.",
        }])));
        if (nextForm.governmentIdentityDocument) {
          setIdentityDocumentName(nextForm.governmentIdentityDocument.objectKey);
          setIdentityDocumentUpload({
            status: "uploaded",
            message: "Uploaded. Choose another file to replace it.",
          });
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [actor, apiBase, guest]);

  const requirements = useMemo(
    () => form.countryCode
      ? requirementsForActor(actor, form.countryCode)
      : undefined,
    [actor, form.countryCode],
  );

  function updateField(field: keyof Omit<CompanyFormState, "identifiers" | "documents">, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function retrySkillTaxonomy(): Promise<void> {
    setTaxonomyStatus("loading");
    try {
      setTaxonomyOptions(await requestSkillTaxonomy());
      setTaxonomyStatus("ready");
    } catch {
      setTaxonomyStatus("error");
    }
  }

  function setCapabilitySelected(slug: string, selected: boolean): void {
    setForm((current) => {
      const slugs = new Set(
        current.capabilitySlugs.split(",").map((value) => value.trim()).filter(Boolean),
      );
      if (selected) slugs.add(slug);
      else slugs.delete(slug);
      return { ...current, capabilitySlugs: Array.from(slugs).join(",") };
    });
    setFieldErrors((current) => {
      if (!current.capabilitySlugs) return current;
      const next = { ...current };
      delete next.capabilitySlugs;
      return next;
    });
  }

  function updateCountry(value: string): void {
    setForm((current) => ({ ...current, countryCode: value, addressCountryCode: value, bankCountryCode: value, identifiers: {}, documents: {} }));
    setFieldErrors((current) => {
      if (!current.countryCode) return current;
      const next = { ...current };
      delete next.countryCode;
      return next;
    });
    setDocumentNames({});
    setDocumentUploads({});
    setMessage("");
  }

  function updateIdentifier(scheme: string, value: string): void {
    setForm((current) => ({ ...current, identifiers: { ...current.identifiers, [scheme]: value } }));
  }

  async function updateDocument(kind: string, event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    if (guest) {
      setDocumentUploads((current) => ({ ...current, [kind]: {
        status: "idle",
        name: file.name,
        message: "Create your account to upload this document.",
      } }));
      return;
    }

    const request = uploadRequestSchema.safeParse({
      kind,
      contentType: file.type,
      size: file.size,
    });
    if (!request.success) {
      setDocumentUploads((current) => ({ ...current, [kind]: {
        status: "failed",
        name: file.name,
        message: file.size > uploadMaxBytes
          ? "This file is larger than 10 MiB. Choose a smaller PDF or image and try again."
          : "This file type is not supported. Choose a PDF, JPEG, PNG or WebP file and try again.",
      } }));
      return;
    }

    setDocumentUploads((current) => ({ ...current, [kind]: {
      status: "uploading",
      name: file.name,
      message: `Uploading ${file.name}…`,
    } }));
    try {
      const credentialResponse = await fetch(`${apiBase}/me/documents/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.data),
      });
      if (!credentialResponse.ok) throw new Error("Upload authorization failed");
      const credential = uploadResponseSchema.safeParse(await credentialResponse.json());
      if (!credential.success) throw new Error("Invalid upload authorization");

      const uploadResponse = await fetch(credential.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Object upload failed");

      const nextDocuments = {
        ...form.documents,
        [kind]: {
          objectKey: credential.data.objectKey,
          uploadedAt: new Date().toISOString(),
        },
      };
      const nextForm = { ...form, documents: nextDocuments };
      const draft = draftSchema.parse(toCompanyPayload(nextForm, actor));
      const saved = await fetch(`${apiBase}/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!saved.ok) throw new Error("Upload record failed");

      setForm(nextForm);
      setDocumentNames((current) => ({ ...current, [kind]: file.name }));
      setDocumentUploads((current) => ({ ...current, [kind]: {
        status: "uploaded",
        name: file.name,
        message: `${file.name} uploaded. Choose another file to replace it.`,
      } }));
    } catch {
      setDocumentUploads((current) => ({ ...current, [kind]: {
        status: "failed",
        name: file.name,
        message: `Upload failed for ${file.name}. Choose the file and try again.`,
      } }));
    }
  }

  async function updateIdentityDocument(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    if (guest) {
      setIdentityDocumentUpload({
        status: "idle",
        name: file.name,
        message: "Create your account to upload this document.",
      });
      return;
    }

    const request = clientUploadRequestSchema.safeParse({
      kind: form.governmentIdentityDocumentKind,
      contentType: file.type,
      size: file.size,
    });
    if (!request.success) {
      setIdentityDocumentUpload({
        status: "failed",
        name: file.name,
        message: file.size > CLIENT_UPLOAD_MAX_BYTES
          ? "This file is larger than 10 MiB. Choose a smaller PDF or image and try again."
          : "This file type is not supported. Choose a PDF, JPEG, PNG or WebP file and try again.",
      });
      return;
    }

    setIdentityDocumentUpload({
      status: "uploading",
      name: file.name,
      message: `Uploading ${file.name}…`,
    });
    try {
      const credentialResponse = await fetch(
        `${apiBase}/me/authorised-person/government-identity-document/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.data),
        },
      );
      if (!credentialResponse.ok) throw new Error("Upload authorization failed");
      const credential = clientUploadResponseSchema.safeParse(
        await credentialResponse.json(),
      );
      if (!credential.success) throw new Error("Invalid upload authorization");
      const uploadResponse = await fetch(credential.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Object upload failed");

      const nextForm: CompanyFormState = {
        ...form,
        governmentIdentityDocument: {
          kind: request.data.kind,
          objectKey: credential.data.objectKey,
          uploadedAt: new Date().toISOString(),
        },
      };
      const draft = clientDraftSchema.parse(toCompanyPayload(nextForm, "client"));
      const saved = await fetch(`${apiBase}/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!saved.ok) throw new Error("Upload record failed");
      setForm(nextForm);
      setIdentityDocumentName(file.name);
      setIdentityDocumentUpload({
        status: "uploaded",
        name: file.name,
        message: `${file.name} uploaded. Choose another file to replace it.`,
      });
    } catch {
      setIdentityDocumentUpload({
        status: "failed",
        name: file.name,
        message: `Upload failed for ${file.name}. Choose the file and try again.`,
      });
    }
  }

  async function persistDraft(): Promise<boolean> {
    const parsed = draftSchema.safeParse(toCompanyPayload(form, actor));
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        const fieldId = schemaIssueField(path);
        if (!nextErrors[fieldId]) nextErrors[fieldId] = issue.message;
      }
      const firstField = Object.keys(nextErrors)[0];
      setFieldErrors(nextErrors);
      setMessageError(true);
      setMessage(firstField ? "Check the highlighted field before saving." : parsed.error.issues[0]?.message ?? "Check your details before saving.");
      if (firstField) {
        pendingFocus.current = `company-${firstField}`;
        setStep(stepForField(firstField));
      }
      return false;
    }
    if (guest) {
      if (!form.countryCode) {
        setMessageError(true);
        setMessage("Choose your company country before creating an account.");
        pendingFocus.current = "company-countryCode";
        setStep("company");
        return false;
      }
      setMessage("");
      setMessageError(false);
      setAccessStep("details");
      return false;
    }
    setFieldErrors({});
    setSaving(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`${apiBase}/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        setMessageError(true);
        setMessage(response.status === 401 ? "Sign in to save your company registration." : "We could not save this registration. Try again.");
        return false;
      }
      setMessage("Draft saved.");
      return true;
    } catch {
      setMessageError(true);
      setMessage("We could not save this registration. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function continueTo(nextStep: StepId): Promise<void> {
    if (guest) {
      if (nextStep === step) return;
      pendingSubmission.current = false;
      await persistDraft();
      return;
    }
    if (await persistDraft()) setStep(nextStep);
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (guest) {
      pendingSubmission.current = true;
      await persistDraft();
      return;
    }
    if (!(await persistDraft())) return;
    setSubmissionMissing([]);
    setSaving(true);
    try {
      const response = await fetch(`${apiBase}/me/submit`, { method: "POST" });
      if (response.ok) {
        setSubmitted(true);
        setMessage("");
      } else {
        const missing = await readSubmissionMissing(response);
        const firstMissing = missing.at(0);
        const first = firstMissing
          ? submissionRequirementTarget(firstMissing, form, actor)
          : firstIncompleteField(form, actor);
        pendingFocus.current = first.id;
        setStep(first.step);
        setMessageError(true);
        setSubmissionMissing(missing);
        setMessage(missing.length > 0
          ? "Complete these requirements before submitting:"
          : "We could not submit this registration. Check the required information and try again.");
      }
    } catch {
      setSubmissionMissing([]);
      setMessageError(true);
      setMessage("We could not submit this registration. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function requestAccount(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = registrationRequestSchema.safeParse({
      countryCode: form.countryCode,
      email: accessEmail,
      phone: accessPhone,
    });
    if (!result.success) {
      const nextErrors = Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
      setAccessErrors(nextErrors);
      setMessageError(true);
      setMessage("Check the highlighted account fields and try again.");
      queueMicrotask(() => document.getElementById(`company-access-${String(result.error.issues[0]?.path[0] ?? "email")}`)?.focus());
      return;
    }
    setAccessErrors({});
    setMessage("");
    let registrationRequestUrl: string;
    try {
      registrationRequestUrl = publicApiUrl("/api/v1/auth/register/request");
    } catch {
      setMessageError(true);
      setMessage(
        "Registration is unavailable because this deployment is missing API configuration.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(registrationRequestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (response.status === 409) {
        setAccessIdentity({ email: result.data.email, phone: result.data.phone });
        setAccessOtp("");
        setMessage("");
        setMessageError(false);
        setAccessStep("existing-account");
        return;
      }
      if (!response.ok) throw new Error("Registration request failed");
      const accepted = registrationRequestAcceptedSchema.safeParse(await response.json());
      if (!accepted.success) throw new Error("Invalid registration response");
      setAccessIdentity({ email: result.data.email, phone: result.data.phone });
      setAccessStep("verification");
    } catch {
      setMessageError(true);
      setMessage("We could not send your verification code. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function requestSignIn(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = otpRequestSchema.safeParse({ email: accessIdentity?.email ?? "" });
    if (!result.success) {
      setMessageError(true);
      setMessage("Enter the email address for your existing account and try again.");
      return;
    }
    setMessage("");
    setMessageError(false);
    let otpRequestUrl: string;
    try {
      otpRequestUrl = publicApiUrl("/api/v1/auth/otp/request");
    } catch {
      setMessageError(true);
      setMessage(
        "Sign-in is unavailable because this deployment is missing API configuration.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(otpRequestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) throw new Error("Sign-in request failed");
      setAccessOtp("");
      setAccessStep("signin-verification");
    } catch {
      setMessageError(true);
      setMessage("We could not send the sign-in code. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDraftAfterAuthentication(): Promise<void> {
    const draftResult = draftSchema.safeParse(toCompanyPayload(form, actor));
    if (!draftResult.success) throw new Error("Invalid company draft");
    const created = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftResult.data),
    });
    if (!created.ok) throw new Error("Draft creation failed");
    if (pendingSubmission.current) {
      const submittedResponse = await fetch(`${apiBase}/me/submit`, { method: "POST" });
      if (!submittedResponse.ok) throw new Error("Submission failed");
    }
    const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
    if (!sessionResponse.ok) throw new Error("Session load failed");
    const session = authSessionSchema.safeParse(await sessionResponse.json());
    if (!session.success) throw new Error("Invalid session");
    onAuthenticated?.(session.data);
  }

  async function verifySignIn(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = otpVerifySchema.safeParse({
      email: accessIdentity?.email ?? "",
      otp: accessOtp,
    });
    if (!result.success) {
      setAccessErrors({ emailOtp: "Enter the six-digit code sent to your email." });
      setMessageError(true);
      setMessage("Check the sign-in code and try again.");
      queueMicrotask(() => document.getElementById("company-access-signinOtp")?.focus());
      return;
    }
    setSaving(true);
    setAccessErrors({});
    setMessage("");
    setMessageError(false);
    try {
      const verified = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!verified.ok) throw new Error("Sign-in verification failed");
      await saveDraftAfterAuthentication();
    } catch {
      setMessageError(true);
      setMessage("We could not sign you in and save this draft. Check the code and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyAccount(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = registrationVerifySchema.safeParse({
      email: accessIdentity?.email ?? "",
      phone: accessIdentity?.phone ?? "",
      emailOtp: accessOtp,
    });
    if (!result.success) {
      setAccessErrors({ emailOtp: "Enter the six-digit code sent to your email." });
      setMessageError(true);
      setMessage("Check the verification code and try again.");
      queueMicrotask(() => document.getElementById("company-access-emailOtp")?.focus());
      return;
    }
    const draftResult = draftSchema.safeParse(toCompanyPayload(form, actor));
    if (!draftResult.success) return;
    setSaving(true);
    setAccessErrors({});
    setMessage("");
    try {
      const verified = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!verified.ok) throw new Error("Verification failed");
      await saveDraftAfterAuthentication();
    } catch {
      setMessageError(true);
      setMessage("Your account was verified, but we could not save the company draft. Try again.");
    } finally {
      setSaving(false);
    }
  }

  type TextField = {
    [Key in keyof CompanyFormState]-?: CompanyFormState[Key] extends string ? Key : never;
  }[keyof CompanyFormState];
  const field = (label: string, fieldName: TextField, type = "text", autoComplete?: string) => (
    <div className="company-onboarding-field" key={fieldName}>
      <label htmlFor={`company-${fieldName}`}>{label}</label>
      <input id={`company-${fieldName}`} type={type} autoComplete={autoComplete} value={form[fieldName] as string} disabled={saving} aria-invalid={fieldErrors[fieldName] ? true : undefined} aria-describedby={fieldErrors[fieldName] ? `company-${fieldName}-error` : undefined} onChange={(event) => updateField(fieldName, event.target.value)} />
      {fieldErrors[fieldName] ? <p id={`company-${fieldName}-error`} className="company-onboarding-error" role="alert">{label}: {fieldErrors[fieldName]}</p> : null}
    </div>
  );

  function stepActions(nextStep?: StepId): React.ReactNode {
    return (
      <div className="company-onboarding-actions">
        <GlassButton type="button" variant="secondary" disabled={saving} onClick={() => { pendingSubmission.current = false; void persistDraft(); }}>{saving ? "Saving…" : "Save draft"}</GlassButton>
        {nextStep ? <GlassButton type="button" variant="primary" disabled={saving} onClick={() => void continueTo(nextStep)}>Continue to {steps.find((item) => item.id === nextStep)?.label}</GlassButton> : null}
      </div>
    );
  }

  function renderCompany(): React.ReactNode {
    return (
      <section aria-labelledby="company-section-title">
        <h2 id="company-section-title" className="home-section-title" tabIndex={-1}>Company</h2>
        {field("Legal name", "legalName", "text", "organization")}
        {field("Trading name (optional)", "tradingName", "text", "organization")}
        <div className="company-onboarding-field">
          <label htmlFor="company-countryCode">Country</label>
          <select id="company-countryCode" value={form.countryCode} disabled={!countryOptions.length || saving} aria-invalid={fieldErrors.countryCode ? true : undefined} aria-describedby={fieldErrors.countryCode ? "company-countryCode-error" : undefined} onChange={(event) => updateCountry(event.target.value)}>
            <option value="">{countryOptions.length ? "Choose a country" : "Loading countries…"}</option>
            {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
          {fieldErrors.countryCode ? <p id="company-countryCode-error" className="company-onboarding-error" role="alert">Country: {fieldErrors.countryCode}</p> : null}
          <p className="company-onboarding-help">Country selection drives the identifiers and documents for your company.</p>
        </div>
        {config.bankDetails ? (
          <fieldset className="company-onboarding-subsection">
            <legend>Bank details</legend>
            {field("Account holder name", "bankAccountHolderName")}
            {field("Account scheme", "bankAccountScheme")}
            {field("Account identifier", "bankAccountValue")}
            {field("Bank country code", "bankCountryCode")}
            {field("Currency code", "bankCurrencyCode")}
          </fieldset>
        ) : null}
        {config.website ? field("Website", "website", "url", "url") : null}
        {config.authorisedPerson ? (
          <fieldset id="company-authorised-person" className="company-onboarding-subsection">
            <legend>Authorised person</legend>
            {field("Authorised person name", "authorisedPersonName", "text", "name")}
            <div className="company-onboarding-field">
              <label htmlFor="company-governmentIdentityDocumentKind">
                Government identity document type
              </label>
              <select
                id="company-governmentIdentityDocumentKind"
                value={form.governmentIdentityDocumentKind}
                disabled={saving || identityDocumentUpload.status === "uploading"}
                onChange={(event) => updateField(
                  "governmentIdentityDocumentKind",
                  event.target.value,
                )}
              >
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENCE">Driving licence</option>
                <option value="VOTER_ID">Voter ID</option>
                {form.countryCode === "IN" ? (
                  <option value="MASKED_AADHAAR_REFERENCE">
                    Masked Aadhaar
                  </option>
                ) : null}
              </select>
            </div>
            <div className="company-onboarding-field">
              <label htmlFor="company-governmentIdentityDocument">
                Government identity document
              </label>
              {guest ? <p className="company-onboarding-help">Create your account to upload this document. You can choose a file after email verification.</p> : null}
              <input
                id="company-governmentIdentityDocument"
                type="file"
                accept={CLIENT_UPLOAD_CONTENT_TYPES.join(",")}
                disabled={
                  saving
                  || identityDocumentUpload.status === "uploading"
                  || !nonEmpty(form.authorisedPersonName)
                  || guest
                }
                aria-describedby="company-governmentIdentityDocument-status"
                onChange={(event) => void updateIdentityDocument(event)}
              />
              <p
                id="company-governmentIdentityDocument-status"
                className={identityDocumentUpload.status === "failed"
                  ? "company-onboarding-error"
                  : "company-onboarding-help"}
                role={identityDocumentUpload.status === "failed" ? "alert" : "status"}
                aria-live="polite"
              >
                {identityDocumentUpload.message}
              </p>
              {!nonEmpty(form.authorisedPersonName) ? (
                <p className="company-onboarding-help">
                  Enter the authorised person&apos;s name before choosing a file.
                </p>
              ) : null}
              {form.countryCode === "IN" ? (
                <p className="company-onboarding-help">
                  Prefer a passport, driving licence or voter ID. If you use
                  Aadhaar, <strong>Aadhaar must be masked</strong>; never upload
                  raw Aadhaar. You can{" "}
                  <a
                    href="https://myaadhaar.uidai.gov.in/genricDownloadAadhaar/en"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download masked Aadhaar from UIDAI
                  </a>.
                </p>
              ) : null}
            </div>
          </fieldset>
        ) : null}
        {stepActions("address")}
      </section>
    );
  }

  function renderAddress(): React.ReactNode {
    return <section aria-labelledby="address-section-title"><h2 id="address-section-title" className="home-section-title" tabIndex={-1}>Address</h2>{field("Address line one", "addressLine1", "text", "address-line1")}{field("Address line two (optional)", "addressLine2", "text", "address-line2")}{field("City", "addressCity", "text", "address-level2")}{field("Region (optional)", "addressRegion", "text", "address-level1")}{field("Postal code", "addressPostalCode", "text", "postal-code")}{stepActions("contact")}</section>;
  }

  function renderContact(): React.ReactNode {
    return <section aria-labelledby="contact-section-title"><h2 id="contact-section-title" className="home-section-title" tabIndex={-1}>Contact</h2>{field("Name", "contactName", "text", "name")}{field("Email", "contactEmail", "email", "email")}{field("Phone", "contactPhone", "tel", "tel")}{stepActions("identifiers")}</section>;
  }

  function renderIdentifiers(): React.ReactNode {
    return (
      <section aria-labelledby="identifiers-section-title">
        <h2 id="identifiers-section-title" className="home-section-title" tabIndex={-1}>Identifiers</h2>
        {requirements ? requirements.identifierSchemes.map((scheme) => <div className="company-onboarding-field" key={scheme}><label htmlFor={`company-identifier-${scheme}`}>{labelForScheme(scheme)}</label><input id={`company-identifier-${scheme}`} type="text" value={form.identifiers[scheme] ?? ""} disabled={saving} onChange={(event) => updateIdentifier(scheme, event.target.value)} /></div>) : <p className="company-onboarding-help">Choose a country to see the applicable identifiers.</p>}
        {requirements ? (
          <fieldset className="company-onboarding-subsection">
            <legend>Required documents</legend>
            <p className="company-onboarding-help">
              Documents are collected for review and are not verified by this registration flow. Upload a PDF, JPEG, PNG or WebP file up to 10 MiB.
            </p>
            {requirements.documentKinds.map((kind) => {
              const upload = documentUploads[kind];
              const statusId = `company-document-${kind}-status`;
              return (
                <div className="company-onboarding-field" key={kind}>
                  <label htmlFor={`company-document-${kind}`}>{labelForDocument(kind)}</label>
                  {guest ? <p id={`${statusId}-guidance`} className="company-onboarding-help">Create your account to upload this document. You can choose a file after email verification.</p> : null}
                  <input
                    id={`company-document-${kind}`}
                    type="file"
                    accept={uploadContentTypes.join(",")}
                    disabled={saving || upload?.status === "uploading" || guest}
                    aria-describedby={guest ? `${statusId}-guidance ${statusId}` : statusId}
                    onChange={(event) => void updateDocument(kind, event)}
                  />
                  <p
                    id={statusId}
                    className={upload?.status === "failed" ? "company-onboarding-error" : "company-onboarding-help"}
                    role={upload?.status === "failed" ? "alert" : "status"}
                    aria-live="polite"
                  >
                    {upload?.message ?? "No file uploaded."}
                  </p>
                </div>
              );
            })}
          </fieldset>
        ) : null}
        {stepActions(config.capabilities ? "capabilities" : "review")}
      </section>
    );
  }

  function renderCapabilities(): React.ReactNode {
    return (
      <section aria-labelledby="capabilities-section-title">
        <h2 id="capabilities-section-title" className="home-section-title" tabIndex={-1}>Capabilities</h2>
        <p className="company-onboarding-help">Select every service your company can deliver.</p>
        {taxonomyStatus === "loading" ? (
          <p className="company-onboarding-help" role="status">Loading services…</p>
        ) : null}
        {taxonomyStatus === "error" ? (
          <div className="company-onboarding-taxonomy-error" role="alert">
            <p>The service list could not be loaded. Try again.</p>
            <GlassButton type="button" variant="secondary" disabled={saving} onClick={() => void retrySkillTaxonomy()}>
              Retry loading services
            </GlassButton>
          </div>
        ) : null}
        {taxonomyStatus === "ready" ? (
          <div className="company-onboarding-taxonomy">
            {selectedCapabilities.length > 0 ? (
              <div className="company-onboarding-selected-capabilities">
                <h3>Selected services</h3>
                <ul aria-label="Selected services">
                  {selectedCapabilities.map((option) => (
                    <li key={option.slug}>
                      <span>{taxonomyLeaf(option)}</span>
                      <button
                        type="button"
                        disabled={saving}
                        aria-label={`Remove ${taxonomyLeaf(option)}`}
                        onClick={() => setCapabilitySelected(option.slug, false)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="company-onboarding-field">
              <label htmlFor="company-capability-search">Search services</label>
              <input
                id="company-capability-search"
                type="search"
                value={capabilitySearch}
                disabled={saving}
                onChange={(event) => setCapabilitySearch(event.target.value)}
              />
            </div>
            {taxonomyOptions.length === 0 ? (
              <p className="company-onboarding-help" role="status">No services are currently available.</p>
            ) : groupedCapabilities.length === 0 ? (
              <p className="company-onboarding-help" role="status">No services match your search.</p>
            ) : (
              <div className="company-onboarding-taxonomy-groups" aria-label="Available services">
                {groupedCapabilities.map((businessUnit) => (
                  <section key={businessUnit.businessUnit} aria-labelledby={`taxonomy-${businessUnit.businessUnit}`}>
                    <h3 id={`taxonomy-${businessUnit.businessUnit}`}>{businessUnit.businessUnit}</h3>
                    {businessUnit.serviceLines.map((serviceLine) => (
                      <div key={serviceLine.serviceLine} className="company-onboarding-taxonomy-service-line">
                        <h4>{serviceLine.serviceLine}</h4>
                        <ul>
                          {serviceLine.options.map((option) => {
                            const selected = selectedCapabilitySlugs.has(option.slug);
                            return (
                              <li key={option.slug}>
                                <button
                                  type="button"
                                  disabled={saving || selected}
                                  aria-pressed={selected}
                                  aria-label={`${selected ? "Selected" : "Select"} ${option.businessUnit} ${option.serviceLine} ${taxonomyLeaf(option)}`}
                                  onClick={() => setCapabilitySelected(option.slug, true)}
                                >
                                  {taxonomyLeaf(option)}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {stepActions("review")}
      </section>
    );
  }

  function summary(label: string, value: string | undefined): React.ReactNode {
    return <div className="company-onboarding-summary-row"><dt>{label}</dt><dd>{value || "Not entered"}</dd></div>;
  }

  function renderReview(): React.ReactNode {
    const selectedDocuments = Object.values(documentNames).filter((value) => value.trim()).join(", ");
    const selectedCapabilityNames = selectedCapabilities.map(taxonomyLeaf).join(", ");
    return <section aria-labelledby="review-section-title"><h2 id="review-section-title" className="home-section-title" tabIndex={-1}>Review</h2><p className="company-onboarding-help">Review the information you entered. You can return to any section before submitting.</p><dl className="company-onboarding-summary">{summary("Legal name", nonEmpty(form.legalName))}{summary("Trading name", nonEmpty(form.tradingName))}{summary("Country", form.countryCode)}{summary("Address", completeAddress(form) ? `${form.addressLine1}, ${form.addressCity}, ${form.addressPostalCode}` : undefined)}{summary("Contact", completeContact(form) ? `${form.contactName} · ${form.contactEmail} · ${form.contactPhone}` : undefined)}{summary("Identifiers", Object.values(form.identifiers).filter((value) => value.trim()).join(", "))}{summary("Documents", selectedDocuments)}{config.capabilities ? summary("Capabilities", selectedCapabilityNames) : null}{config.bankDetails ? summary("Bank details", completeBankDetails(form) ? "Entered" : undefined) : null}{config.website ? summary("Website", nonEmpty(form.website)) : null}{config.authorisedPerson ? summary("Authorised person", nonEmpty(form.authorisedPersonName)) : null}{config.authorisedPerson ? summary("Government identity document", identityDocumentName || form.governmentIdentityDocument?.objectKey) : null}</dl><div className="company-onboarding-review-actions">{steps.slice(0, -1).map((item) => <GlassButton key={item.id} type="button" variant="secondary" disabled={saving} onClick={() => setStep(item.id)}>Edit {item.label}</GlassButton>)}<GlassButton type="button" variant="secondary" disabled={saving} onClick={() => { pendingSubmission.current = false; void persistDraft(); }}>{saving ? "Saving…" : "Save draft"}</GlassButton><GlassButton type="submit" variant="primary" disabled={saving}>{saving ? "Submitting…" : "Submit registration"}</GlassButton></div></section>;
  }

  function renderSubmissionMessage(): React.ReactNode {
    if (submissionMissing.length === 0) {
      return <p className="registration-form-message" role={messageError && Object.keys(fieldErrors).length === 0 ? "alert" : undefined} aria-live="polite">{message}</p>;
    }
    return (
      <div className="company-onboarding-requirements" role="alert" aria-live="assertive">
        <p>{message}</p>
        <ul>
          {submissionMissing.map((code, index) => {
            const copy = SUBMISSION_REQUIREMENT_COPY[code] ?? {
              label: code,
              instruction: "review this requirement and try again",
            };
            const target = submissionRequirementTarget(code, form, actor);
            return (
              <li key={`${code}-${index}`}>
                <a
                  href={`#${target.sectionId}`}
                  onClick={(event) => {
                    event.preventDefault();
                    pendingFocus.current = target.id;
                    setStep(target.step);
                  }}
                >
                  <strong>{copy.label}:</strong> {copy.instruction}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function renderSubmitted(): React.ReactNode {
    return <FrostedSurface aria-labelledby="company-onboarding-status-title" className="company-onboarding-status-page" variant="panel"><p className="home-eyebrow">Company registration</p><h1 id="company-onboarding-status-title">Registration under review</h1><p className="company-onboarding-copy">Your registration has been submitted and is under review by the compliance team.</p></FrostedSurface>;
  }

  if (loading) return <p className="company-onboarding-status">Loading your company profile…</p>;
  if (loadError) return <p className="company-onboarding-status" role="alert">We could not load your company profile. Refresh and try again.</p>;
  if (submitted) return renderSubmitted();

  if (accessStep === "details") {
    return <FrostedSurface aria-labelledby="company-access-title" className="company-onboarding-shell" variant="panel"><p className="home-eyebrow">Company registration</p><h1 id="company-access-title">Create account to save</h1><p className="company-onboarding-copy">Verify your email to securely save this company registration and return to it later.</p><form className="company-onboarding-form" noValidate onSubmit={requestAccount}><div className="company-onboarding-field"><label htmlFor="company-access-email">Email address</label><input id="company-access-email" type="email" autoComplete="email" value={accessEmail} disabled={saving} aria-invalid={Boolean(accessErrors.email)} onChange={(event) => setAccessEmail(event.target.value)} />{accessErrors.email ? <p className="company-onboarding-error" role="alert">Enter a valid email address.</p> : null}</div><div className="company-onboarding-field"><label htmlFor="company-access-phone">Phone number</label><input id="company-access-phone" type="tel" autoComplete="tel" value={accessPhone} disabled={saving} aria-invalid={Boolean(accessErrors.phone)} onChange={(event) => setAccessPhone(event.target.value)} />{accessErrors.phone ? <p className="company-onboarding-error" role="alert">Enter a valid international phone number beginning with +.</p> : null}</div><p className="registration-form-message" role={messageError ? "alert" : undefined} aria-live="polite">{message}</p><div className="company-onboarding-actions"><GlassButton type="button" variant="secondary" disabled={saving} onClick={() => { setAccessStep(null); setMessage(""); }}>Back to company details</GlassButton><GlassButton type="submit" variant="primary" disabled={saving}>{saving ? "Sending…" : "Send verification code"}</GlassButton></div></form></FrostedSurface>;
  }

  if (accessStep === "existing-account") {
    return <FrostedSurface aria-labelledby="company-access-title" className="company-onboarding-shell" variant="panel"><p className="home-eyebrow">Company registration</p><h1 id="company-access-title">You already have an account. Sign in to continue.</h1><p className="company-onboarding-copy">Your entered details for {form.legalName || "this company"} are still here. Sign in with {accessIdentity?.email} and we will save them to your account.</p><form className="company-onboarding-form" noValidate onSubmit={requestSignIn}><p className="registration-form-message" role={messageError ? "alert" : undefined} aria-live="polite">{message}</p><div className="company-onboarding-actions"><GlassButton type="button" variant="secondary" disabled={saving} onClick={() => { setAccessStep("details"); setMessage(""); }}>Use different account details</GlassButton><GlassButton type="submit" variant="primary" disabled={saving}>{saving ? "Sending…" : "Send sign-in code"}</GlassButton></div></form></FrostedSurface>;
  }

  if (accessStep === "signin-verification") {
    return <FrostedSurface aria-labelledby="company-access-title" className="company-onboarding-shell" variant="panel"><p className="home-eyebrow">Company registration</p><h1 id="company-access-title">Enter your sign-in code</h1><p className="company-onboarding-copy">If an account uses {accessIdentity?.email}, a six-digit code was sent there. Your company details remain ready to save.</p><form className="company-onboarding-form" noValidate onSubmit={verifySignIn}><div className="company-onboarding-field"><label htmlFor="company-access-signinOtp">Email sign-in code</label><input id="company-access-signinOtp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={accessOtp} disabled={saving} aria-invalid={Boolean(accessErrors.emailOtp)} onChange={(event) => setAccessOtp(event.target.value)} />{accessErrors.emailOtp ? <p className="company-onboarding-error" role="alert">{accessErrors.emailOtp}</p> : null}</div><p className="registration-form-message" role={messageError ? "alert" : undefined} aria-live="polite">{message}</p><div className="company-onboarding-actions"><GlassButton type="button" variant="secondary" disabled={saving} onClick={() => { setAccessStep("existing-account"); setMessage(""); }}>Back</GlassButton><GlassButton type="submit" variant="primary" disabled={saving}>{saving ? "Signing in…" : "Sign in and save draft"}</GlassButton></div></form></FrostedSurface>;
  }

  if (accessStep === "verification") {
    return <FrostedSurface aria-labelledby="company-access-title" className="company-onboarding-shell" variant="panel"><p className="home-eyebrow">Company registration</p><h1 id="company-access-title">Verify your email</h1><p className="company-onboarding-copy">Enter the six-digit code sent to {accessIdentity?.email}.</p><form className="company-onboarding-form" noValidate onSubmit={verifyAccount}><div className="company-onboarding-field"><label htmlFor="company-access-emailOtp">Email verification code</label><input id="company-access-emailOtp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={accessOtp} disabled={saving} aria-invalid={Boolean(accessErrors.emailOtp)} onChange={(event) => setAccessOtp(event.target.value)} />{accessErrors.emailOtp ? <p className="company-onboarding-error" role="alert">{accessErrors.emailOtp}</p> : null}</div><p className="registration-form-message" role={messageError ? "alert" : undefined} aria-live="polite">{message}</p><div className="company-onboarding-actions"><GlassButton type="button" variant="secondary" disabled={saving} onClick={() => setAccessStep("details")}>Change details</GlassButton><GlassButton type="submit" variant="primary" disabled={saving}>{saving ? "Verifying…" : "Verify and save draft"}</GlassButton></div></form></FrostedSurface>;
  }

  return <FrostedSurface aria-labelledby="company-onboarding-title" className="company-onboarding-shell" variant="panel"><p className="home-eyebrow">Company registration</p><h1 id="company-onboarding-title">Register your company.</h1><p className="company-onboarding-copy">{guest ? "Fill the company form now. When you save or continue, verify your email once so your draft is protected and available when you return." : "Save your details as you go. Country selection shows only the identifiers and documents that apply to your company."}</p><nav className="company-onboarding-stepper" aria-label="Company registration steps"><ol>{steps.map((item) => <li key={item.id}><button type="button" disabled={saving} data-current={step === item.id} data-state={step === item.id ? "current" : steps.findIndex((part) => part.id === item.id) < steps.findIndex((part) => part.id === step) ? "previous" : "upcoming"} aria-current={step === item.id ? "step" : undefined} onClick={() => guest ? setStep(item.id) : void continueTo(item.id)}>{item.label}</button></li>)}</ol></nav><form className="company-onboarding-form" noValidate onSubmit={submitRegistration}>{step === "company" ? renderCompany() : null}{step === "address" ? renderAddress() : null}{step === "contact" ? renderContact() : null}{step === "identifiers" ? renderIdentifiers() : null}{step === "capabilities" ? renderCapabilities() : null}{step === "review" ? renderReview() : null}{renderSubmissionMessage()}</form></FrostedSurface>;
}
