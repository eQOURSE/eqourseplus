import {
  digestCompanyIdentifier,
  loadIdentifierHmacSecret,
} from "../company-registration/company-registration";

type VendorIdentifierEnvironment = Record<string, string | undefined>;

export function loadVendorIdentifierHmacSecret(
  environment: VendorIdentifierEnvironment,
): string {
  return loadIdentifierHmacSecret(environment, "VENDOR_IDENTIFIER_HMAC_SECRET");
}

export function digestVendorIdentifier(
  countryCode: string,
  scheme: string,
  value: string,
  secret: string,
): string {
  return digestCompanyIdentifier(countryCode, scheme, value, secret, "vendor");
}
