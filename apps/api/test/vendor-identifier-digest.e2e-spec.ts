import { describe, expect, it } from "vitest";

import {
  digestVendorIdentifier,
  loadVendorIdentifierHmacSecret,
} from "../src/vendors/vendor-identifier-digest";

describe("FR-REG-08A vendor identifier digests", () => {
  it("canonicalizes before hashing so equivalent values share a digest", () => {
    const secret = "vendor-identifier-test-secret-at-least-32-characters";

    expect(
      digestVendorIdentifier("IN", "GSTIN", "29ABCDE1234F1Z5", secret),
    ).toBe(
      digestVendorIdentifier("IN", "GSTIN", "29 abcde 1234 f1z5", secret),
    );
  });

  it("binds the digest to the identifier scheme and uses keyed SHA-256", () => {
    const secret = "vendor-identifier-test-secret-at-least-32-characters";

    expect(
      digestVendorIdentifier("IN", "GSTIN", "29ABCDE1234F1Z5", secret),
    ).not.toBe(
      digestVendorIdentifier("IN", "COMPANY_PAN", "29ABCDE1234F1Z5", secret),
    );
    expect(
      digestVendorIdentifier("IN", "GSTIN", "29ABCDE1234F1Z5", secret),
    ).toHaveLength(64);
    expect(
      digestVendorIdentifier("IN", "GSTIN", "29ABCDE1234F1Z5", secret),
    ).toMatch(/^[0-9a-f]+$/);
    expect(
      digestVendorIdentifier("IN", "GSTIN", "29ABCDE1234F1Z5", secret),
    ).not.toBe(
      digestVendorIdentifier("IN", "GSTIN", "29ABCDE1234F1Z6", secret),
    );
  });

  it("rejects an identifier scheme that is not required for the country", () => {
    expect(() =>
      digestVendorIdentifier(
        "SG",
        "GSTIN",
        "29ABCDE1234F1Z5",
        "vendor-identifier-test-secret-at-least-32-characters",
      ),
    ).toThrow("not applicable to SG");
  });

  it("requires a dedicated server secret", () => {
    expect(() => loadVendorIdentifierHmacSecret({})).toThrow(
      "VENDOR_IDENTIFIER_HMAC_SECRET is required",
    );
    expect(
      loadVendorIdentifierHmacSecret({
        VENDOR_IDENTIFIER_HMAC_SECRET:
          "vendor-identifier-test-secret-at-least-32-characters",
      }),
    ).toBe("vendor-identifier-test-secret-at-least-32-characters");
  });
});
