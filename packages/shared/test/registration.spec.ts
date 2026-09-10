import { describe, expect, it } from "vitest";

import {
  registrationRequestAcceptedSchema,
  registrationRequestSchema,
  registrationVerifySchema,
} from "../src";

describe("FR-REG-01 registration contracts", () => {
  it("normalizes and validates strict freelancer registration request bodies", () => {
    expect(
      registrationRequestSchema.parse({
        email: " User@Example.com ",
        phone: "+919876543210",
        countryCode: " in ",
        pan: " abcde1234f ",
      }),
    ).toEqual({
      email: "user@example.com",
      phone: "+919876543210",
      countryCode: "IN",
      pan: "ABCDE1234F",
    });

    expect(() =>
      registrationRequestSchema.parse({
        email: "user@example.com",
        phone: "9876543210",
        countryCode: "IN",
      }),
    ).toThrow();
    expect(() =>
      registrationRequestSchema.parse({
        email: "user@example.com",
        phone: "+6591234567",
        countryCode: "SG",
        pan: "ABCDE1234F",
      }),
    ).toThrow();
    expect(() =>
      registrationRequestSchema.parse({
        email: "user@example.com",
        phone: "+919876543210",
        countryCode: "IN",
        unexpected: true,
      }),
    ).toThrow();
  });

  it("requires email OTP and allows the service to decide whether phone OTP applies", () => {
    const valid = {
      email: "user@example.com",
      phone: "+919876543210",
      emailOtp: "123456",
      phoneOtp: "654321",
    };
    expect(registrationVerifySchema.parse(valid)).toEqual(valid);
    expect(
      registrationVerifySchema.parse({ ...valid, phoneOtp: undefined }),
    ).toEqual({
      email: valid.email,
      phone: valid.phone,
      emailOtp: valid.emailOtp,
    });
    expect(() =>
      registrationVerifySchema.parse({ ...valid, emailOtp: undefined }),
    ).toThrow();
    expect(() =>
      registrationVerifySchema.parse({ ...valid, unexpected: true }),
    ).toThrow();
  });

  it("accepts only the channel combinations the registration API can issue", () => {
    expect(
      registrationRequestAcceptedSchema.parse({
        status: "accepted",
        channels: ["email"],
      }),
    ).toEqual({ status: "accepted", channels: ["email"] });
    expect(
      registrationRequestAcceptedSchema.parse({
        status: "accepted",
        channels: ["email", "phone"],
      }),
    ).toEqual({ status: "accepted", channels: ["email", "phone"] });
    expect(() =>
      registrationRequestAcceptedSchema.parse({
        status: "accepted",
        channels: ["phone"],
      }),
    ).toThrow();
  });
});
