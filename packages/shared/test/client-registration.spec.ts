import { describe, expect, it } from "vitest";

import {
  ClientState,
  canTransitionClient,
  clientDraftSchema,
  getCompanyCountryRequirements,
  getVendorCountryRequirements,
} from "../src";

describe("FR-REG-15 client registration contracts", () => {
  it("defines a distinct client state machine", () => {
    expect(Object.values(ClientState)).toEqual([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "MORE_INFO_NEEDED",
      "APPROVED",
      "REJECTED",
    ]);
    expect(canTransitionClient(ClientState.DRAFT, ClientState.SUBMITTED)).toBe(true);
    expect(canTransitionClient(ClientState.MORE_INFO_NEEDED, ClientState.SUBMITTED)).toBe(true);
    expect(canTransitionClient(ClientState.SUBMITTED, ClientState.APPROVED)).toBe(false);
  });

  it("uses one company registry for German client and vendor identifiers", () => {
    const client = getCompanyCountryRequirements("DE");
    const vendor = getVendorCountryRequirements("DE");

    expect(client?.identifierSchemes).toEqual(["EU_VAT"]);
    expect(vendor?.identifierSchemes).toEqual(client?.identifierSchemes);
    expect(client?.documentKinds).toEqual(["EU_VAT_CERTIFICATE"]);
    expect(vendor?.documentKinds).toEqual(["EU_VAT_CERTIFICATE", "BANK_PROOF"]);
  });

  it("accepts partial drafts, rejects unknown fields, and exposes no payment contract", () => {
    expect(clientDraftSchema.parse({ legalName: "Acme" })).toEqual({ legalName: "Acme" });
    expect(clientDraftSchema.parse({ authorisedPerson: { name: "Director" } })).toEqual({
      authorisedPerson: { name: "Director" },
    });
    expect(clientDraftSchema.safeParse({ bankDetails: {} }).success).toBe(false);
    expect(clientDraftSchema.safeParse({ bankProof: {} }).success).toBe(false);
    expect(clientDraftSchema.safeParse({ paymentInstrument: {} }).success).toBe(false);
    expect(clientDraftSchema.safeParse({ unknownField: true }).success).toBe(false);
  });

  it("normalizes ordinary website entries and rejects executable schemes", () => {
    expect(clientDraftSchema.parse({ website: "www.eqourse.com" }).website)
      .toBe("https://www.eqourse.com");
    expect(clientDraftSchema.parse({ website: "  www.eqourse.com  " }).website)
      .toBe("https://www.eqourse.com");
    expect(clientDraftSchema.safeParse({ website: "javascript:alert(1)" }).success)
      .toBe(false);
    expect(clientDraftSchema.safeParse({ website: "ftp://www.eqourse.com" }).success)
      .toBe(false);
  });
});
