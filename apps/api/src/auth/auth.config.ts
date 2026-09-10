import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@eqourse/shared";

export interface AuthConfig {
  jwtSecret: string;
  phoneVerificationRequired: boolean;
  otpTtlMilliseconds: number;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  authRateLimitWindowMilliseconds: number;
  authRateLimitMaxRequests: number;
}

type AuthEnvironment = Record<string, string | undefined>;

export function loadAuthConfig(environment: AuthEnvironment): AuthConfig {
  const jwtSecret = environment.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  const phoneVerificationRequired =
    environment.PHONE_VERIFICATION_REQUIRED ?? "false";
  if (
    phoneVerificationRequired !== "true" &&
    phoneVerificationRequired !== "false"
  ) {
    throw new Error("PHONE_VERIFICATION_REQUIRED must be true or false");
  }

  return {
    jwtSecret,
    phoneVerificationRequired: phoneVerificationRequired === "true",
    otpTtlMilliseconds: 10 * 60 * 1000,
    accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SECONDS,
    authRateLimitWindowMilliseconds: 60 * 1000,
    authRateLimitMaxRequests: 5,
  };
}
