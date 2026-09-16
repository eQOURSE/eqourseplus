import {
  digestCompanyIdentifier,
  loadIdentifierHmacSecret,
} from "../company-registration/company-registration";

export function loadClientIdentifierHmacSecret(
  environment: Record<string, string | undefined>,
): string {
  return loadIdentifierHmacSecret(environment, "CLIENT_IDENTIFIER_HMAC_SECRET");
}

export function digestClientIdentifier(
  countryCode: string,
  scheme: string,
  value: string,
  secret: string,
): string {
  return digestCompanyIdentifier(countryCode, scheme, value, secret, "client");
}
