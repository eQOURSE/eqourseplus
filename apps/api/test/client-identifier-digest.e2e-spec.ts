import { describe, expect, it } from "vitest";

import {
  digestClientIdentifier,
  loadClientIdentifierHmacSecret,
} from "../src/clients/client-identifier-digest";
import { digestVendorIdentifier } from "../src/vendors/vendor-identifier-digest";

describe("FR-REG-15 client identifier digests", () => {
  it("canonicalizes identifiers before hashing", () => {
    const secret = "client-identifier-test-secret-at-least-32-characters";
    expect(digestClientIdentifier("DE", "EU_VAT", "de 123-456", secret)).toBe(
      digestClientIdentifier("DE", "EU_VAT", "DE123456", secret),
    );
  });

  it("uses a client-specific domain separate from vendor digests", () => {
    const secret = "shared-test-secret-that-is-at-least-32-characters";
    expect(digestClientIdentifier("DE", "EU_VAT", "DE123456", secret)).not.toBe(
      digestVendorIdentifier("DE", "EU_VAT", "DE123456", secret),
    );
  });

  it("requires a dedicated client secret", () => {
    expect(() => loadClientIdentifierHmacSecret({})).toThrow(
      "CLIENT_IDENTIFIER_HMAC_SECRET is required",
    );
    expect(() =>
      loadClientIdentifierHmacSecret({ CLIENT_IDENTIFIER_HMAC_SECRET: "short" }),
    ).toThrow("CLIENT_IDENTIFIER_HMAC_SECRET must contain at least 32 characters");
  });
});
