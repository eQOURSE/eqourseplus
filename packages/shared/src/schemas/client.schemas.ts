import { z } from "zod";

export const CLIENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const CLIENT_UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const countryCode = z
  .string()
  .regex(/^[A-Za-z]{2}$/, "Must be an ISO alpha-2 country code");
const identifier = z.strictObject({
  scheme: z.string().min(1),
  value: z.string().min(1),
});
const documentKind = z.string().regex(/^[A-Z][A-Z0-9_]*$/);
const document = z.strictObject({
  kind: documentKind,
  objectKey: z.string().min(1),
  uploadedAt: z.coerce.date(),
});

export const clientDraftSchema = z.strictObject({
  legalName: z.string().min(1).optional(),
  tradingName: z.string().min(1).optional(),
  countryCode: countryCode.optional(),
  registeredAddress: z
    .strictObject({
      line1: z.string().min(1),
      line2: z.string().min(1).optional(),
      city: z.string().min(1),
      region: z.string().min(1).optional(),
      postalCode: z.string().min(1),
      countryCode,
    })
    .optional(),
  website: z.url().optional(),
  contactPerson: z
    .strictObject({
      name: z.string().min(1),
      email: z.email(),
      phone: z.string().min(1),
    })
    .optional(),
  authorisedPerson: z
    .strictObject({
      name: z.string().min(1),
      governmentIdentityDocument: document.optional(),
    })
    .optional(),
  countryIdentifiers: z.array(identifier).optional(),
  documents: z.array(document).optional(),
});

export type ClientDraftInput = z.infer<typeof clientDraftSchema>;

export const clientUploadRequestSchema = z.strictObject({
  kind: documentKind,
  contentType: z.enum(CLIENT_UPLOAD_CONTENT_TYPES),
  size: z.number().int().positive().max(CLIENT_UPLOAD_MAX_BYTES),
});

export const clientUploadResponseSchema = z.strictObject({
  uploadUrl: z.url(),
  objectKey: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export type ClientUploadRequest = z.infer<typeof clientUploadRequestSchema>;
export type ClientUploadResponse = z.infer<typeof clientUploadResponseSchema>;
