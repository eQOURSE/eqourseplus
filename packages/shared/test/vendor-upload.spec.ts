import { describe, expect, it } from "vitest";

import { vendorUploadRequestSchema } from "../src";

describe("FR-REG-08A vendor document upload input", () => {
  it.each(["application/pdf", "image/jpeg", "image/png", "image/webp"])(
    "accepts %s at no more than 10 MiB",
    (contentType) => {
      expect(
        vendorUploadRequestSchema.parse({
          kind: "BANK_PROOF",
          contentType,
          size: 10 * 1024 * 1024,
        }),
      ).toEqual({ kind: "BANK_PROOF", contentType, size: 10 * 1024 * 1024 });
    },
  );

  it.each([
    { kind: "BANK_PROOF", contentType: "image/svg+xml", size: 100 },
    { kind: "BANK_PROOF", contentType: "application/javascript", size: 100 },
    { kind: "BANK_PROOF", contentType: "application/pdf", size: 10 * 1024 * 1024 + 1 },
    { kind: "BANK_PROOF", contentType: "application/pdf", size: 0 },
    { kind: "BANK_PROOF", contentType: "application/pdf", size: 100, objectKey: "vendors/other/file.pdf" },
    { kind: "BANK_PROOF", contentType: "application/pdf", size: 100, filename: "../../file.pdf" },
  ])("rejects unsafe upload input %#", (input) => {
    expect(vendorUploadRequestSchema.safeParse(input).success).toBe(false);
  });
});
