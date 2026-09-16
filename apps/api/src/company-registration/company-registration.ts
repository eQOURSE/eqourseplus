import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { StorageAdapter } from "@eqourse/adapters";
import {
  getCompanyCountryRequirements,
  type CompanyCountryRequirements,
} from "@eqourse/shared";
import { createHmac, randomUUID } from "node:crypto";

export const COMPANY_UPLOAD_EXPIRY_SECONDS = 5 * 60;

export function loadIdentifierHmacSecret(
  environment: Record<string, string | undefined>,
  name: string,
): string {
  const secret = environment[name];
  if (!secret) throw new Error(`${name} is required`);
  if (secret.length < 32) {
    throw new Error(`${name} must contain at least 32 characters`);
  }
  return secret;
}

export function digestCompanyIdentifier(
  countryCode: string,
  scheme: string,
  value: string,
  secret: string,
  actor: "vendor" | "client",
): string {
  const requirements = getCompanyCountryRequirements(countryCode);
  if (!requirements) {
    throw new Error(`Unsupported ${actor} country code: ${countryCode}`);
  }
  const normalizedScheme = scheme.trim().toUpperCase();
  const canonicalValue = requirements.canonicalize(normalizedScheme, value);
  return createHmac("sha256", secret)
    .update(`eqourse-plus:${actor}-identifier:`)
    .update(normalizedScheme)
    .update(":")
    .update(canonicalValue)
    .digest("hex");
}

export function canonicalizeCompanyIdentifier(
  countryCode: string,
  scheme: string,
  value: string,
  actor: "vendor" | "client",
): string {
  const requirements = getCompanyCountryRequirements(countryCode);
  if (!requirements) throw new BadRequestException(`Unsupported ${actor} country`);
  try {
    return requirements.canonicalize(scheme.trim().toUpperCase(), value);
  } catch {
    throw new BadRequestException("Identifier scheme is not applicable to this country");
  }
}

export function assertDocumentKey(
  objectKey: string,
  prefix: string,
  actor: "vendor" | "client",
): void {
  if (!objectKey.startsWith(prefix)) {
    throw new BadRequestException(
      `Document key does not belong to this ${actor} and document kind`,
    );
  }
}

export function missingCompanyRequirements(
  identifiers: readonly { scheme: string }[],
  documents: readonly { kind: string }[],
  requirements: CompanyCountryRequirements | undefined,
): string[] {
  if (!requirements) return ["country_requirements"];
  const missing: string[] = [];
  const schemes = new Set(identifiers.map((identifier) => identifier.scheme));
  if (requirements.identifierSchemes.some((scheme) => !schemes.has(scheme))) {
    missing.push("country_identifiers");
  }
  const kinds = new Set(documents.map((document) => document.kind));
  if (requirements.documentKinds.some((kind) => !kinds.has(kind))) {
    missing.push("documents");
  }
  return missing;
}

export async function createCompanyUpload(
  storage: StorageAdapter,
  prefix: string,
  input: { contentType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp"; size: number },
): Promise<{ uploadUrl: string; objectKey: string; expiresAt: string }> {
  const extension = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[input.contentType];
  const objectKey = `${prefix}${randomUUID()}.${extension}`;
  let signed: Awaited<ReturnType<StorageAdapter["createSignedUrl"]>>;
  try {
    signed = await storage.createSignedUrl({
      objectKey,
      contentType: input.contentType,
      contentLength: input.size,
      expiresInSeconds: COMPANY_UPLOAD_EXPIRY_SECONDS,
    });
  } catch {
    throw new ServiceUnavailableException("Document upload is temporarily unavailable");
  }
  return {
    uploadUrl: signed.url,
    objectKey,
    expiresAt: new Date(Date.now() + COMPANY_UPLOAD_EXPIRY_SECONDS * 1_000).toISOString(),
  };
}
