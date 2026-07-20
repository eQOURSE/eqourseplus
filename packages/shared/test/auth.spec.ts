import { describe, expect, it } from "vitest";

import {
  BusinessUnit,
  otpRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  Role,
  roleAssignmentSchema,
} from "../src";

describe("FR-FND-02 shared auth contracts", () => {
  it("exports exactly the roles required by SPEC.md Section 3", () => {
    expect(Object.values(Role)).toEqual([
      "FREELANCER",
      "VENDOR",
      "VENDOR_MEMBER",
      "VERIFIER",
      "PROJECT_MANAGER",
      "QA_REVIEWER",
      "FINANCE_ADMIN",
      "SUPER_ADMIN",
      "CLIENT",
    ]);
  });

  it("validates business-unit-scoped role assignments", () => {
    expect(
      roleAssignmentSchema.parse({
        role: Role.PROJECT_MANAGER,
        businessUnit: BusinessUnit.EQOURSE,
      }),
    ).toEqual({
      role: Role.PROJECT_MANAGER,
      businessUnit: BusinessUnit.EQOURSE,
    });
    expect(() =>
      roleAssignmentSchema.parse({
        role: "OWNER",
        businessUnit: BusinessUnit.EQOURSE,
      }),
    ).toThrow();
  });

  it("validates each public auth request body", () => {
    expect(otpRequestSchema.parse({ email: " User@Example.com " })).toEqual({
      email: "user@example.com",
    });
    expect(
      otpVerifySchema.parse({ email: "user@example.com", otp: "123456" }),
    ).toEqual({ email: "user@example.com", otp: "123456" });
    expect(refreshTokenSchema.parse({ refreshToken: "a".repeat(32) })).toEqual({
      refreshToken: "a".repeat(32),
    });
    expect(() => otpRequestSchema.parse({ email: "not-an-email" })).toThrow();
    expect(() =>
      otpVerifySchema.parse({ email: "user@example.com", otp: "12345" }),
    ).toThrow();
  });
});
