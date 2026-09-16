export type CompanyIdentifierCanonicalizer = (value: string) => string;

export interface CompanyCountryRequirements {
  countryCode: string;
  identifierSchemes: readonly string[];
  documentKinds: readonly string[];
  canonicalForms: Readonly<Record<string, CompanyIdentifierCanonicalizer>>;
  canonicalize(scheme: string, value: string): string;
}

export type VendorIdentifierCanonicalizer = CompanyIdentifierCanonicalizer;
export type VendorCountryRequirements = CompanyCountryRequirements;

const normalizeIdentifier = (value: string): string =>
  value.trim().toUpperCase().replace(/[\s./\\_-]+/g, "");

const canonicalForms = (...schemes: string[]) =>
  Object.freeze(
    Object.fromEntries(
      schemes.map((scheme) => [scheme, normalizeIdentifier]),
    ) as Record<string, CompanyIdentifierCanonicalizer>,
  );

const createRequirements = (
  countryCode: string,
  identifierSchemes: readonly string[],
  documentKinds: readonly string[],
): CompanyCountryRequirements => {
  const forms = canonicalForms(...identifierSchemes);

  return Object.freeze({
    countryCode,
    identifierSchemes: Object.freeze([...identifierSchemes]),
    documentKinds: Object.freeze([...documentKinds]),
    canonicalForms: forms,
    canonicalize(scheme: string, value: string): string {
      const canonicalizer = forms[scheme];
      if (!canonicalizer) {
        throw new Error(
          `Identifier scheme ${scheme} is not applicable to ${countryCode}`,
        );
      }
      return canonicalizer(value);
    },
  });
};

const INDIA = createRequirements(
  "IN",
  ["GSTIN", "COMPANY_PAN", "UDYAM"],
  ["GST_CERTIFICATE", "COMPANY_PAN", "UDYAM_CERTIFICATE"],
);

const UNITED_STATES = createRequirements(
  "US",
  ["INCORPORATION_NUMBER", "EIN"],
  ["INCORPORATION_DOCUMENT", "W_9"],
);

const UNITED_KINGDOM = createRequirements(
  "GB",
  ["COMPANIES_HOUSE", "VAT"],
  ["COMPANIES_HOUSE_RECORD", "VAT_CERTIFICATE"],
);

const EUROPEAN_UNION = createRequirements(
  "EU",
  ["EU_VAT"],
  ["EU_VAT_CERTIFICATE"],
);

const SINGAPORE = createRequirements(
  "SG",
  ["UEN"],
  ["ACRA_RECORD"],
);

const CHINA = createRequirements(
  "CN",
  ["CN_USCC"],
  ["CN_USCC_CERTIFICATE"],
);

const REST_OF_WORLD = createRequirements(
  "ROW",
  ["INCORPORATION_NUMBER", "TAX_ID"],
  ["INCORPORATION_DOCUMENT", "TAX_ID_DOCUMENT"],
);

const EUROPEAN_UNION_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
] as const;

export const companyCountryRequirements: Readonly<
  Record<string, CompanyCountryRequirements>
> = Object.freeze({
  IN: INDIA,
  US: UNITED_STATES,
  GB: UNITED_KINGDOM,
  ...Object.fromEntries(
    EUROPEAN_UNION_COUNTRIES.map((countryCode) => [
      countryCode,
      createRequirements(
        countryCode,
        EUROPEAN_UNION.identifierSchemes,
        EUROPEAN_UNION.documentKinds,
      ),
    ]),
  ),
  SG: SINGAPORE,
  CN: CHINA,
});

const withVendorDocuments = (
  requirements: CompanyCountryRequirements,
): VendorCountryRequirements =>
  Object.freeze({
    ...requirements,
    documentKinds: Object.freeze([
      ...requirements.documentKinds,
      "BANK_PROOF",
    ]),
  });

export const vendorCountryRequirements: Readonly<
  Record<string, VendorCountryRequirements>
> = Object.freeze(
  Object.fromEntries(
    Object.entries(companyCountryRequirements).map(([countryCode, requirements]) => [
      countryCode,
      withVendorDocuments(requirements),
    ]),
  ),
);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const isIsoCountryCode = (countryCode: string): boolean => {
  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === "ZZ") {
    return false;
  }
  const displayName = regionNames.of(countryCode);
  return Boolean(displayName && displayName !== countryCode);
};

export function getCompanyCountryRequirements(
  countryCode: string,
): CompanyCountryRequirements | undefined {
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  if (!isIsoCountryCode(normalizedCountryCode)) {
    return undefined;
  }

  return (
    companyCountryRequirements[normalizedCountryCode] ??
    createRequirements(
      normalizedCountryCode,
      REST_OF_WORLD.identifierSchemes,
      REST_OF_WORLD.documentKinds,
    )
  );
}

export function getVendorCountryRequirements(
  countryCode: string,
): VendorCountryRequirements | undefined {
  const requirements = getCompanyCountryRequirements(countryCode);
  if (!requirements) return undefined;
  return vendorCountryRequirements[requirements.countryCode] ?? withVendorDocuments(requirements);
}
