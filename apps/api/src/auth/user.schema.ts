import { BusinessUnit, Role } from "@eqourse/shared";
import { Schema, type HydratedDocument, type Model, model, models } from "mongoose";

export interface UserRecord {
  email: string;
  roleAssignments: Array<{
    role: Role;
    businessUnit: BusinessUnit;
  }>;
  otpChallenge?: {
    digest: string;
    expiresAt: Date;
    wrongAttempts: number;
  };
  refreshSessions: Array<{
    digest: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date;
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

const userSchema = new Schema<UserRecord>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    roleAssignments: {
      type: [roleAssignmentSchema],
      required: true,
      default: [],
    },
    otpChallenge: { type: otpChallengeSchema },
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

export const UserModel =
  (models.User as Model<UserRecord> | undefined) ??
  model<UserRecord>("User", userSchema);
