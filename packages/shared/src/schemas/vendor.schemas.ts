import { z } from "zod";

const countryCode = z.string().regex(/^[A-Za-z]{2}$/, "Must be an ISO alpha-2 country code");
const identifier = z.strictObject({
  scheme: z.string().min(1),
  value: z.string().min(1),
});
const capability = z.strictObject({ taxonomySlug: z.string().min(1) });
const document = z.strictObject({
  kind: z.string().min(1),
  objectKey: z.string().min(1),
  uploadedAt: z.coerce.date(),
});

export const vendorDraftSchema = z.strictObject({
  legalName: z.string().min(1).optional(),
  tradingName: z.string().min(1).optional(),
  countryCode: countryCode.optional(),
  registeredAddress: z.strictObject({
    line1: z.string().min(1),
    line2: z.string().min(1).optional(),
    city: z.string().min(1),
    region: z.string().min(1).optional(),
    postalCode: z.string().min(1),
    countryCode,
  }).optional(),
  contactPerson: z.strictObject({
    name: z.string().min(1),
    email: z.email(),
    phone: z.string().min(1),
  }).optional(),
  capabilities: z.array(capability).optional(),
  countryIdentifiers: z.array(identifier).optional(),
  bankDetails: z.strictObject({
    accountHolderName: z.string().min(1),
    bankCountryCode: countryCode,
    currencyCode: z.string().regex(/^[A-Za-z]{3}$/),
    accountIdentifier: identifier,
    bankIdentifier: identifier.optional(),
  }).optional(),
  documents: z.array(document).optional(),
});

export type VendorDraftInput = z.infer<typeof vendorDraftSchema>;
