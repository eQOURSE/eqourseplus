import { z } from "zod";

import { BusinessUnit, Role } from "../auth/role";

export const roleSchema = z.enum(Role);
export const businessUnitSchema = z.enum(BusinessUnit);

export const roleAssignmentSchema = z.object({
  role: roleSchema,
  businessUnit: businessUnitSchema,
});

const normalizedEmailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const otpRequestSchema = z.strictObject({
  email: normalizedEmailSchema,
});

export const otpVerifySchema = z.strictObject({
  email: normalizedEmailSchema,
  otp: z.string().regex(/^\d{6}$/),
});

export const refreshTokenSchema = z.strictObject({
  refreshToken: z.string().min(32),
});

export type OtpRequest = z.infer<typeof otpRequestSchema>;
export type OtpVerifyRequest = z.infer<typeof otpVerifySchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
