import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@eqourse/shared";

export interface AuthConfig {
  jwtSecret: string;
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

  return {
    jwtSecret,
    otpTtlMilliseconds: 10 * 60 * 1000,
    accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SECONDS,
    authRateLimitWindowMilliseconds: 60 * 1000,
    authRateLimitMaxRequests: 5,
  };
}
