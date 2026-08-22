import { BusinessUnit, ProfileState, Role } from "@eqourse/shared";
import { Schema, type HydratedDocument, type Model, model, models } from "mongoose";

export interface UserRecord {
  email: string;
  phone?: string | null;
  phoneVerifiedAt?: Date | null;
  countryCode?: string;
  pan?: string | null;
  roleAssignments: Array<{
    role: Role;
    businessUnit: BusinessUnit;
  }>;
  otpChallenge?: {
    digest: string;
    expiresAt: Date;
    wrongAttempts: number;
  };
  phoneOtpChallenge?: {
    digest: string;
    expiresAt: Date;
    wrongAttempts: number;
  };
  profileState?: ProfileState;
  deviceFingerprints: Array<{
    hash: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
  }>;
  reviewFlags: Array<{
    kind: "DUPLICATE_DEVICE";
    detail: string;
    raisedAt: Date;
    resolvedAt: Date | null;
  }>;
  refreshSessions: Array<{
    digest: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date | null;
  }>;
}

export type UserDocument = HydratedDocument<UserRecord>;

const roleAssignmentSchema = new Schema(
  {
    role: { type: String, enum: Object.values(Role), required: true },
    businessUnit: {
      type: String,
      enum: Object.values(BusinessUnit),
      required: true,
    },
  },
  { _id: false, strict: "throw" },
);

const otpChallengeSchema = new Schema(
  {
    digest: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    wrongAttempts: { type: Number, required: true, min: 0 },
  },
  { _id: false, strict: "throw" },
);

const refreshSessionSchema = new Schema(
  {
    digest: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { _id: false, strict: "throw" },
);

const deviceFingerprintSchema = new Schema(
  {
    hash: { type: String, required: true },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
  },
  { _id: false, strict: "throw" },
);

const reviewFlagSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["DUPLICATE_DEVICE"],
      required: true,
    },
    detail: { type: String, required: true },
    raisedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
  },
  { _id: false, strict: "throw" },
);

function omitNullForSparseIndex(
  value: string | null | undefined,
): string | undefined {
  return value === null || value === undefined ? undefined : value;
}

const userSchema = new Schema<UserRecord>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      set: omitNullForSparseIndex,
    },
    phoneVerifiedAt: { type: Date, default: null },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}$/,
    },
    pan: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      set: omitNullForSparseIndex,
    },
    roleAssignments: {
      type: [roleAssignmentSchema],
      required: true,
      default: [],
    },
    otpChallenge: { type: otpChallengeSchema },
    phoneOtpChallenge: { type: otpChallengeSchema },
    profileState: {
      type: String,
      enum: Object.values(ProfileState),
      required: true,
      default: ProfileState.DRAFT,
      index: true,
    },
    deviceFingerprints: {
      type: [deviceFingerprintSchema],
      required: true,
      default: [],
    },
    reviewFlags: {
      type: [reviewFlagSchema],
      required: true,
      default: [],
    },
    refreshSessions: {
      type: [refreshSessionSchema],
      required: true,
      default: [],
    },
  },
  {
    collection: "users",
    strict: "throw",
    timestamps: true,
  },
);

userSchema.index({ "deviceFingerprints.hash": 1 });

export const UserModel =
  (models.User as Model<UserRecord> | undefined) ??
  model<UserRecord>("User", userSchema);
