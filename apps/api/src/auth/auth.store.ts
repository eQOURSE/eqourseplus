import type { ProfileState, RoleAssignment } from "@eqourse/shared";

export interface OtpChallenge {
  digest: string;
  expiresAt: Date;
  wrongAttempts: number;
}

export interface RefreshSession {
  digest: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
}

export interface StoredUser {
  id: string;
  email: string;
  profileState: ProfileState;
  phone?: string;
  phoneVerifiedAt?: Date | null;
  roleAssignments: RoleAssignment[];
  otpChallenge?: OtpChallenge;
  refreshSessions: RefreshSession[];
}

export type OtpVerificationResult = "VALID" | "INVALID" | "EXPIRED";

export interface AuthStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  findById(id: string): Promise<StoredUser | null>;
  setOtpChallenge(userId: string, challenge: OtpChallenge): Promise<void>;
  verifyOtp(
    userId: string,
    digest: string,
    now: Date,
    maxWrongAttempts: number,
  ): Promise<OtpVerificationResult>;
  addRefreshSession(userId: string, session: RefreshSession): Promise<void>;
  rotateRefreshSession(
    userId: string,
    currentDigest: string,
    replacement: RefreshSession,
    now: Date,
  ): Promise<boolean>;
  revokeRefreshSession(
    userId: string,
    digest: string,
    now: Date,
  ): Promise<boolean>;
}
