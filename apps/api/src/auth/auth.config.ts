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
    accessTokenTtlSeconds: 15 * 60,
    refreshTokenTtlSeconds: 30 * 24 * 60 * 60,
    authRateLimitWindowMilliseconds: 60 * 1000,
    authRateLimitMaxRequests: 5,
  };
}
