import { describe, expect, it } from "vitest";

import {
  getVendorCountryRequirements,
  vendorCountryRequirements,
} from "../src";

describe("FR-REG-08A vendor country registry", () => {
  it("defines the required country-specific identifier schemes and documents", () => {
    expect(getVendorCountryRequirements("IN")).toMatchObject({
      countryCode: "IN",
      identifierSchemes: ["GSTIN", "COMPANY_PAN", "UDYAM"],
      documentKinds: [
        "GST_CERTIFICATE",
        "COMPANY_PAN",
        "UDYAM_CERTIFICATE",
        "BANK_PROOF",
      ],
    });
    expect(getVendorCountryRequirements("US")).toMatchObject({
      identifierSchemes: ["INCORPORATION_NUMBER", "EIN"],
      documentKinds: ["INCORPORATION_DOCUMENT", "W_9", "BANK_PROOF"],
    });
    expect(getVendorCountryRequirements("GB")).toMatchObject({
      identifierSchemes: ["COMPANIES_HOUSE", "VAT"],
    });
    expect(getVendorCountryRequirements("DE")).toMatchObject({
      identifierSchemes: ["EU_VAT"],
    });
    expect(getVendorCountryRequirements("SG")).toMatchObject({
      identifierSchemes: ["UEN"],
    });
    expect(getVendorCountryRequirements("CN")).toMatchObject({
      identifierSchemes: ["CN_USCC"],
    });
    expect(getVendorCountryRequirements("AU")).toMatchObject({
      identifierSchemes: ["INCORPORATION_NUMBER", "TAX_ID"],
      documentKinds: ["INCORPORATION_DOCUMENT", "TAX_ID_DOCUMENT", "BANK_PROOF"],
    });
  });

  it("returns a separate immutable registry entry for every ISO country code", () => {
    expect(getVendorCountryRequirements("in")?.countryCode).toBe("IN");
    expect(getVendorCountryRequirements("ZZ")).toBeUndefined();
    expect(vendorCountryRequirements.IN).not.toBe(
      vendorCountryRequirements.AU,
    );
  });

  it("canonicalizes each identifier according to its scheme", () => {
    expect(
      getVendorCountryRequirements("IN")?.canonicalize("GSTIN", " 27 a a a c b 2230 m 1 z 2 "),
    ).toBe("27AAACB2230M1Z2");
    expect(
      getVendorCountryRequirements("IN")?.canonicalize("COMPANY_PAN", " ab-cde 1234 f "),
    ).toBe("ABCDE1234F");
    expect(
      getVendorCountryRequirements("US")?.canonicalize("EIN", "12-3456789"),
    ).toBe("123456789");
    expect(
      getVendorCountryRequirements("GB")?.canonicalize(
        "COMPANIES_HOUSE",
        " 00 123 456 ",
      ),
    ).toBe("00123456");
    expect(
      getVendorCountryRequirements("SG")?.canonicalize("UEN", "2019-123456-A"),
    ).toBe("2019123456A");
    expect(
      getVendorCountryRequirements("CN")?.canonicalize("CN_USCC", "9132 0100 MA1234567X"),
    ).toBe("91320100MA1234567X");
  });
});
