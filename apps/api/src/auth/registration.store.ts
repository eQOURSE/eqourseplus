import type { ProfileState } from "@eqourse/shared";

import type { OtpChallenge, RefreshSession } from "./auth.store";

export type RegistrationConflictField = "email" | "phone" | "pan" | "unknown";

export interface RegistrationValues {
  email: string;
  phone: string;
  countryCode: string;
  pan?: string;
  profileState: ProfileState;
  emailChallenge: OtpChallenge;
  phoneChallenge: OtpChallenge;
  deviceFingerprint: {
    hash: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
  };
}

export interface PendingRegistration {
  id: string;
  emailChallenge?: OtpChallenge;
  phoneChallenge?: OtpChallenge;
}

export type RegistrationWriteResult =
  | { status: "WRITTEN"; userId: string }
  | { status: "CONFLICT"; field: RegistrationConflictField };

export interface RegistrationStore {
  deviceFingerprintExists(hash: string, excludeUserId?: string): Promise<boolean>;
  createRegistration(
    values: RegistrationValues,
    duplicateDevice: boolean,
  ): Promise<RegistrationWriteResult>;
  findReclaimableRegistration(
    values: Pick<RegistrationValues, "email" | "phone" | "pan">,
    now: Date,
  ): Promise<{ id: string } | null>;
  reclaimRegistration(
    userId: string,
    values: RegistrationValues,
    duplicateDevice: boolean,
    now: Date,
  ): Promise<RegistrationWriteResult>;
  findPendingRegistration(
    email: string,
    phone: string,
  ): Promise<PendingRegistration | null>;
  completeRegistration(
    userId: string,
    emailDigest: string,
    phoneDigest: string,
    session: RefreshSession,
    now: Date,
  ): Promise<boolean>;
  recordFailedVerification(
    userId: string,
    emailFailed: boolean,
    phoneFailed: boolean,
    now: Date,
    maxWrongAttempts: number,
  ): Promise<void>;
}
