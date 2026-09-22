import {
  getCompanyCountryRequirements,
  getVendorCountryRequirements,
  type VendorDraftInput,
} from "@eqourse/shared";

import { companyActorConfig, type CompanyActor } from "./company-onboarding-config";

export type StepId = "company" | "address" | "contact" | "identifiers" | "capabilities" | "review";

export const STEPS: readonly { id: StepId; label: string }[] = [
  { id: "company", label: "Company" },
  { id: "address", label: "Address" },
  { id: "contact", label: "Contact" },
  { id: "identifiers", label: "Identifiers" },
  { id: "capabilities", label: "Capabilities" },
  { id: "review", label: "Review" },
];

export interface CompanyFormState {
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

export const EMPTY_FORM: CompanyFormState = {
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

function nonEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function completeAddress(form: CompanyFormState): NonNullable<
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

export function requirementsForActor(actor: CompanyActor, countryCode: string) {
  return actor === "client"
    ? getCompanyCountryRequirements(countryCode)
    : getVendorCountryRequirements(countryCode);
}

export function completeContact(form: CompanyFormState): NonNullable<
  VendorDraftInput["contactPerson"]
> | undefined {
  const name = nonEmpty(form.contactName);
  const email = nonEmpty(form.contactEmail);
  const phone = nonEmpty(form.contactPhone);
  return name && email && phone ? { name, email, phone } : undefined;
}

export function completeBankDetails(form: CompanyFormState): NonNullable<
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

export function formFromDraft(draft: Record<string, unknown>): CompanyFormState {
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

export function incompleteSteps(form: CompanyFormState, actor: CompanyActor): readonly StepId[] {
  return STEPS.slice(0, -1)
    .filter((step) => !isComplete(step.id, form, actor))
    .map((step) => step.id);
}

export function firstIncompleteStep(form: CompanyFormState, actor: CompanyActor): StepId {
  for (const step of STEPS.slice(0, -1)) {
    if (!isComplete(step.id, form, actor)) return step.id;
  }
  return "review";
}
