import { getVendorCountryRequirements } from "@eqourse/shared";
import { createHmac } from "node:crypto";

type VendorIdentifierEnvironment = Record<string, string | undefined>;

export function loadVendorIdentifierHmacSecret(
  environment: VendorIdentifierEnvironment,
): string {
  const secret = environment.VENDOR_IDENTIFIER_HMAC_SECRET;
  if (!secret) {
    throw new Error("VENDOR_IDENTIFIER_HMAC_SECRET is required");
  }
  if (secret.length < 32) {
    throw new Error(
      "VENDOR_IDENTIFIER_HMAC_SECRET must contain at least 32 characters",
    );
  }
  return secret;
}

export function digestVendorIdentifier(
  countryCode: string,
  scheme: string,
  value: string,
  secret: string,
): string {
  const requirements = getVendorCountryRequirements(countryCode);
  if (!requirements) {
    throw new Error(`Unsupported vendor country code: ${countryCode}`);
  }

  const normalizedScheme = scheme.trim().toUpperCase();
  const canonicalValue = requirements.canonicalize(normalizedScheme, value);

  return createHmac("sha256", secret)
    .update("eqourse-plus:vendor-identifier:")
    .update(normalizedScheme)
    .update(":")
    .update(canonicalValue)
    .digest("hex");
}
