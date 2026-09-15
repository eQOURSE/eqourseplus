import { z } from "zod";

export const VENDOR_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const VENDOR_UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

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

export const vendorUploadRequestSchema = z.strictObject({
  kind: z.string().min(1),
  contentType: z.enum(VENDOR_UPLOAD_CONTENT_TYPES),
  size: z.number().int().positive().max(VENDOR_UPLOAD_MAX_BYTES),
});

export const vendorUploadResponseSchema = z.strictObject({
  uploadUrl: z.url(),
  objectKey: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export type VendorUploadRequest = z.infer<typeof vendorUploadRequestSchema>;
export type VendorUploadResponse = z.infer<typeof vendorUploadResponseSchema>;
