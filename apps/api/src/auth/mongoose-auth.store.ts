import { Injectable, Optional } from "@nestjs/common";
import { connect, connection } from "mongoose";

import { DatabaseConnectionService } from "../database/database-connection.service";
import type {
  AuthStore,
  OtpChallenge,
  OtpVerificationResult,
  RefreshSession,
  StoredUser,
} from "./auth.store";
import { UserModel, type UserDocument } from "./user.schema";

@Injectable()
export class MongooseAuthStore implements AuthStore {
  private connectionPromise?: Promise<void>;

  constructor(
    @Optional()
    private readonly databaseConnection?: DatabaseConnectionService,
  ) {}

  async findByEmail(email: string): Promise<StoredUser | null> {
    await this.ensureConnected();
    return this.toStoredUser(await UserModel.findOne({ email }).exec());
  }

  async findById(id: string): Promise<StoredUser | null> {
    await this.ensureConnected();
    return this.toStoredUser(await UserModel.findById(id).exec());
  }

  async setOtpChallenge(
    userId: string,
    challenge: OtpChallenge,
  ): Promise<void> {
    await this.ensureConnected();
    await UserModel.updateOne(
      { _id: userId },
      { $set: { otpChallenge: challenge } },
    ).exec();
  }

  async verifyOtp(
    userId: string,
    digest: string,
    now: Date,
    maxWrongAttempts: number,
  ): Promise<OtpVerificationResult> {
    await this.ensureConnected();
    const user = await UserModel.findById(userId).exec();
    const challenge = user?.otpChallenge;
    if (!challenge || challenge.expiresAt <= now) {
      await UserModel.updateOne(
        { _id: userId },
        { $unset: { otpChallenge: 1 } },
      ).exec();
      return "EXPIRED";
    }

    if (challenge.digest === digest) {
      const result = await UserModel.updateOne(
        {
          _id: userId,
          "otpChallenge.digest": digest,
          "otpChallenge.expiresAt": { $gt: now },
        },
        { $unset: { otpChallenge: 1 } },
      ).exec();
      return result.modifiedCount === 1 ? "VALID" : "INVALID";
    }

    const updated = await UserModel.findOneAndUpdate(
      {
        _id: userId,
        "otpChallenge.expiresAt": { $gt: now },
        "otpChallenge.wrongAttempts": { $lt: maxWrongAttempts },
      },
      { $inc: { "otpChallenge.wrongAttempts": 1 } },
      { new: true },
    ).exec();
    if (
      updated?.otpChallenge &&
      updated.otpChallenge.wrongAttempts >= maxWrongAttempts
    ) {
      await UserModel.updateOne(
        {
          _id: userId,
          "otpChallenge.wrongAttempts": { $gte: maxWrongAttempts },
        },
        { $unset: { otpChallenge: 1 } },
      ).exec();
    }
    return "INVALID";
  }

  async addRefreshSession(
    userId: string,
    session: RefreshSession,
  ): Promise<void> {
    await this.ensureConnected();
    await UserModel.updateOne(
      { _id: userId },
      { $push: { refreshSessions: session } },
    ).exec();
  }

  async rotateRefreshSession(
    userId: string,
    currentDigest: string,
    replacement: RefreshSession,
    now: Date,
  ): Promise<boolean> {
    await this.ensureConnected();
    const result = await UserModel.updateOne(
      {
        _id: userId,
        refreshSessions: {
          $elemMatch: {
            digest: currentDigest,
            revokedAt: { $exists: false },
            expiresAt: { $gt: now },
          },
        },
      },
      {
        $set: { "refreshSessions.$.revokedAt": now },
        $push: { refreshSessions: replacement },
      },
    ).exec();
    return result.modifiedCount === 1;
  }

  async revokeRefreshSession(
    userId: string,
    digest: string,
    now: Date,
  ): Promise<boolean> {
    await this.ensureConnected();
    const result = await UserModel.updateOne(
      {
        _id: userId,
        refreshSessions: {
          $elemMatch: { digest, revokedAt: { $exists: false } },
        },
      },
      { $set: { "refreshSessions.$.revokedAt": now } },
    ).exec();
    return result.modifiedCount === 1;
  }

  private async ensureConnected(): Promise<void> {
    if (connection.readyState === 1) return;
    if (this.databaseConnection) {
      await this.databaseConnection.connect();
      return;
    }
    if (!this.connectionPromise) {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error("MONGODB_URI is required for auth persistence");
      this.connectionPromise = connect(uri)
        .then(() => undefined)
        .catch((error: unknown) => {
          this.connectionPromise = undefined;
          throw error;
        });
    }
    await this.connectionPromise;
  }

  private toStoredUser(user: UserDocument | null): StoredUser | null {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      roleAssignments: user.roleAssignments.map((assignment) => ({
        role: assignment.role,
        businessUnit: assignment.businessUnit,
      })),
      otpChallenge: user.otpChallenge
        ? {
            digest: user.otpChallenge.digest,
            expiresAt: user.otpChallenge.expiresAt,
            wrongAttempts: user.otpChallenge.wrongAttempts,
          }
        : undefined,
      refreshSessions: user.refreshSessions.map((session) => ({
        digest: session.digest,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        ...(session.revokedAt ? { revokedAt: session.revokedAt } : {}),
      })),
    };
  }
}
