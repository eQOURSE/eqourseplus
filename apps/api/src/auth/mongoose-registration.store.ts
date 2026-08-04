import { Injectable, Optional } from "@nestjs/common";
import { connect, connection } from "mongoose";

import { DatabaseConnectionService } from "../database/database-connection.service";
import type { OtpChallenge, RefreshSession } from "./auth.store";
import type {
  PendingRegistration,
  RegistrationConflictField,
  RegistrationStore,
  RegistrationValues,
  RegistrationWriteResult,
} from "./registration.store";
import { UserModel } from "./user.schema";

const DUPLICATE_DEVICE_DETAIL = "Device fingerprint matches another account";

@Injectable()
export class MongooseRegistrationStore implements RegistrationStore {
  private connectionPromise?: Promise<void>;

  constructor(
    @Optional()
    private readonly databaseConnection?: DatabaseConnectionService,
  ) {}

  async deviceFingerprintExists(
    hash: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    await this.ensureConnected();
    const query: Record<string, unknown> = { "deviceFingerprints.hash": hash };
    if (excludeUserId) query._id = { $ne: excludeUserId };
    return (await UserModel.exists(query)) !== null;
  }

  async createRegistration(
    values: RegistrationValues,
    duplicateDevice: boolean,
  ): Promise<RegistrationWriteResult> {
    await this.ensureConnected();
    try {
      const user = await UserModel.create({
        email: values.email,
        phone: values.phone,
        phoneVerifiedAt: null,
        countryCode: values.countryCode,
        ...(values.pan ? { pan: values.pan } : {}),
        roleAssignments: [],
        profileState: values.profileState,
        deviceFingerprints: [values.deviceFingerprint],
        reviewFlags: duplicateDevice
          ? [this.duplicateDeviceFlag(values.deviceFingerprint.firstSeenAt)]
          : [],
        otpChallenge: values.emailChallenge,
        phoneOtpChallenge: values.phoneChallenge,
        refreshSessions: [],
      });
      return { status: "WRITTEN", userId: user.id };
    } catch (error) {
      return this.duplicateResultOrThrow(error);
    }
  }

  async findReclaimableRegistration(
    values: Pick<RegistrationValues, "email" | "phone" | "pan">,
    now: Date,
  ): Promise<{ id: string } | null> {
    await this.ensureConnected();
    const conflicts: Array<Record<string, string>> = [
      { email: values.email },
      { phone: values.phone },
    ];
    if (values.pan) conflicts.push({ pan: values.pan });
    const user = await UserModel.findOne({
      phoneVerifiedAt: null,
      "otpChallenge.expiresAt": { $lte: now },
      "phoneOtpChallenge.expiresAt": { $lte: now },
      $or: conflicts,
    })
      .select({ _id: 1 })
      .lean()
      .exec();
    return user ? { id: String(user._id) } : null;
  }

  async reclaimRegistration(
    userId: string,
    values: RegistrationValues,
    duplicateDevice: boolean,
    now: Date,
  ): Promise<RegistrationWriteResult> {
    await this.ensureConnected();
    const update: Record<string, unknown> = {
      $set: {
        email: values.email,
        phone: values.phone,
        phoneVerifiedAt: null,
        countryCode: values.countryCode,
        profileState: values.profileState,
        otpChallenge: values.emailChallenge,
        phoneOtpChallenge: values.phoneChallenge,
      },
      $push: {
        deviceFingerprints: values.deviceFingerprint,
        ...(duplicateDevice
          ? { reviewFlags: this.duplicateDeviceFlag(now) }
          : {}),
      },
    };
    if (values.pan) {
      (update.$set as Record<string, unknown>).pan = values.pan;
    } else {
      update.$unset = { pan: 1 };
    }

    try {
      const result = await UserModel.updateOne(
        {
          _id: userId,
          phoneVerifiedAt: null,
          "otpChallenge.expiresAt": { $lte: now },
          "phoneOtpChallenge.expiresAt": { $lte: now },
        },
        update,
      ).exec();
      return result.modifiedCount === 1
        ? { status: "WRITTEN", userId }
        : { status: "CONFLICT", field: "unknown" };
    } catch (error) {
      return this.duplicateResultOrThrow(error);
    }
  }

  async findPendingRegistration(
    email: string,
    phone: string,
  ): Promise<PendingRegistration | null> {
    await this.ensureConnected();
    const user = await UserModel.findOne({
      email,
      phone,
      phoneVerifiedAt: null,
    }).exec();
    if (!user) return null;
    return {
      id: user.id,
      emailChallenge: this.challenge(user.otpChallenge),
      phoneChallenge: this.challenge(user.phoneOtpChallenge),
    };
  }

  async completeRegistration(
    userId: string,
    emailDigest: string,
    phoneDigest: string,
    session: RefreshSession,
    now: Date,
  ): Promise<boolean> {
    await this.ensureConnected();
    const result = await UserModel.updateOne(
      {
        _id: userId,
        phoneVerifiedAt: null,
        "otpChallenge.digest": emailDigest,
        "otpChallenge.expiresAt": { $gt: now },
        "phoneOtpChallenge.digest": phoneDigest,
        "phoneOtpChallenge.expiresAt": { $gt: now },
      },
      {
        $set: { phoneVerifiedAt: now },
        $unset: { otpChallenge: 1, phoneOtpChallenge: 1 },
        $push: { refreshSessions: session },
      },
    ).exec();
    return result.modifiedCount === 1;
  }

  async recordFailedVerification(
    userId: string,
    emailFailed: boolean,
    phoneFailed: boolean,
    now: Date,
    maxWrongAttempts: number,
  ): Promise<void> {
    await this.ensureConnected();
    await Promise.all([
      this.recordChallengeFailure(
        userId,
        "otpChallenge",
        emailFailed,
        now,
        maxWrongAttempts,
      ),
      this.recordChallengeFailure(
        userId,
        "phoneOtpChallenge",
        phoneFailed,
        now,
        maxWrongAttempts,
      ),
    ]);
  }

  private async recordChallengeFailure(
    userId: string,
    field: "otpChallenge" | "phoneOtpChallenge",
    failed: boolean,
    now: Date,
    maxWrongAttempts: number,
  ): Promise<void> {
    if (!failed) return;
    const updated = await UserModel.findOneAndUpdate(
      {
        _id: userId,
        [`${field}.expiresAt`]: { $gt: now },
        [`${field}.wrongAttempts`]: { $lt: maxWrongAttempts },
      },
      { $inc: { [`${field}.wrongAttempts`]: 1 } },
      { returnDocument: "after" },
    ).exec();
    const challenge = updated?.[field] as OtpChallenge | undefined;
    if (challenge && challenge.wrongAttempts >= maxWrongAttempts) {
      await UserModel.updateOne(
        { _id: userId, [`${field}.wrongAttempts`]: { $gte: maxWrongAttempts } },
        { $unset: { [field]: 1 } },
      ).exec();
    }
  }

  private challenge(
    challenge: OtpChallenge | null | undefined,
  ): OtpChallenge | undefined {
    return challenge
      ? {
          digest: challenge.digest,
          expiresAt: challenge.expiresAt,
          wrongAttempts: challenge.wrongAttempts,
        }
      : undefined;
  }

  private duplicateDeviceFlag(now: Date) {
    return {
      kind: "DUPLICATE_DEVICE" as const,
      detail: DUPLICATE_DEVICE_DETAIL,
      raisedAt: now,
      resolvedAt: null,
    };
  }

  private duplicateResultOrThrow(error: unknown): RegistrationWriteResult {
    if (this.isDuplicateKey(error)) {
      return { status: "CONFLICT", field: this.conflictField(error) };
    }
    throw error;
  }

  private isDuplicateKey(error: unknown): error is {
    code: number;
    keyPattern?: Record<string, unknown>;
  } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
    );
  }

  private conflictField(error: {
    keyPattern?: Record<string, unknown>;
  }): RegistrationConflictField {
    for (const field of ["email", "phone", "pan"] as const) {
      if (error.keyPattern && field in error.keyPattern) return field;
    }
    return "unknown";
  }

  private async ensureConnected(): Promise<void> {
    if (connection.readyState === 1) return;
    if (this.databaseConnection) {
      await this.databaseConnection.connect();
      return;
    }
    if (!this.connectionPromise) {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error("MONGODB_URI is required for registration persistence");
      this.connectionPromise = connect(uri)
        .then(() => undefined)
        .catch((error: unknown) => {
          this.connectionPromise = undefined;
          throw error;
        });
    }
    await this.connectionPromise;
  }
}
