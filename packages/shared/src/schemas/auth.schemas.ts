import { z } from "zod";

import { BusinessUnit, Role } from "../auth/role";
import { ProfileState } from "../states/profile-state";

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

export const authTokenPairSchema = z.strictObject({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const authSessionSchema = z.strictObject({
  userId: z.string().min(1),
  email: normalizedEmailSchema,
  roleAssignments: z.array(roleAssignmentSchema),
  profileState: z.enum(ProfileState),
});

export type OtpRequest = z.infer<typeof otpRequestSchema>;
export type OtpVerifyRequest = z.infer<typeof otpVerifySchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type AuthTokenPair = z.infer<typeof authTokenPairSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
