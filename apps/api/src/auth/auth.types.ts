import type { StoredUser } from "./auth.store";

export interface AuthClock {
  now(): Date;
}

export interface AuthenticatedRequest {
  headers: { authorization?: string };
  authUser?: StoredUser;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
