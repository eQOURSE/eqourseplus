import { model, models, Schema, type Model, type Types } from "mongoose";

export enum AttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  PASSED = "PASSED",
  FAILED = "FAILED",
  UNDER_REVIEW = "UNDER_REVIEW",
  EXPIRED = "EXPIRED",
}

export type ViolationKind = "FULLSCREEN_EXIT" | "TAB_SWITCH" | "WINDOW_BLUR";
export type Tier = "BRONZE" | "SILVER" | "GOLD";

export interface TestAttemptRecord {
  userId: Types.ObjectId;
  taxonomySlug: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: Date;
  expiresAt: Date;
  passThresholdPercent: number;
  tierBands: { silverMinPercent: number; goldMinPercent: number };
  submittedAt?: Date;
  items: Array<{
    questionId: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
  }>;
  answers: Array<{ questionId: string; optionId: string }>;
  scorePercent?: number;
  violations: Array<{ kind: ViolationKind; occurredAt: Date }>;
  tier?: Tier;
}

const optionSchema = new Schema({ id: String, text: String }, { _id: false, strict: "throw" });
const itemSchema = new Schema({
  questionId: { type: String, required: true },
  prompt: { type: String, required: true },
  options: { type: [optionSchema], required: true },
  correctOptionId: { type: String, required: true },
}, { _id: false, strict: "throw" });
const answerSchema = new Schema({
  questionId: { type: String, required: true },
  optionId: { type: String, required: true },
}, { _id: false, strict: "throw" });
const violationSchema = new Schema({
  kind: { type: String, enum: ["FULLSCREEN_EXIT", "TAB_SWITCH", "WINDOW_BLUR"], required: true },
  occurredAt: { type: Date, required: true },
}, { _id: false, strict: "throw" });
const tierBandsSchema = new Schema({
  silverMinPercent: { type: Number, required: true, min: 0, max: 100 },
  goldMinPercent: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false, strict: "throw" });

export const testAttemptSchema = new Schema<TestAttemptRecord>({
  userId: { type: Schema.Types.ObjectId, required: true },
  taxonomySlug: { type: String, required: true },
  attemptNumber: { type: Number, required: true, min: 1 },
  status: { type: String, enum: Object.values(AttemptStatus), required: true },
  startedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  passThresholdPercent: { type: Number, required: true, min: 0, max: 100 },
  tierBands: { type: tierBandsSchema, required: true },
  submittedAt: { type: Date },
  items: { type: [itemSchema], required: true },
  answers: { type: [answerSchema], required: true, default: [] },
  scorePercent: { type: Number, min: 0, max: 100 },
  violations: { type: [violationSchema], required: true, default: [] },
  tier: { type: String, enum: ["BRONZE", "SILVER", "GOLD"] },
}, { collection: "testAttempts", strict: "throw", timestamps: true });

testAttemptSchema.index({ userId: 1, taxonomySlug: 1, attemptNumber: 1 }, { unique: true, name: "test_attempt_number_unique" });
testAttemptSchema.index({ userId: 1, taxonomySlug: 1, startedAt: -1 }, { name: "test_attempt_lookup" });

export const TestAttemptModel = (models.TestAttempt as Model<TestAttemptRecord> | undefined) ?? model<TestAttemptRecord>("TestAttempt", testAttemptSchema);
