import { model, models, Schema, type Model } from "mongoose";

export interface TestQuestion {
  id: string;
  kind: "MCQ";
  status: "DRAFT" | "APPROVED";
  prompt: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
}

export interface TestRecord {
  taxonomySlug: string;
  timeLimitSeconds: number;
  questionCount: number;
  passThresholdPercent: number;
  cooldownDays: number;
  maxAttempts: number;
  tierBands: { silverMinPercent: number; goldMinPercent: number };
  questions: TestQuestion[];
}

const optionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
}, { _id: false, strict: "throw" });

const questionSchema = new Schema({
  id: { type: String, required: true },
  kind: { type: String, enum: ["MCQ"], required: true },
  status: { type: String, enum: ["DRAFT", "APPROVED"], required: true },
  prompt: { type: String, required: true },
  difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"], required: true },
  options: { type: [optionSchema], required: true },
  correctOptionId: { type: String, required: true },
}, { _id: false, strict: "throw" });

const tierBandsSchema = new Schema({
  silverMinPercent: { type: Number, required: true, min: 0, max: 100 },
  goldMinPercent: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false, strict: "throw" });

export const testSchema = new Schema<TestRecord>({
  taxonomySlug: { type: String, required: true },
  timeLimitSeconds: { type: Number, required: true, min: 1 },
  questionCount: { type: Number, required: true, min: 1 },
  passThresholdPercent: { type: Number, required: true, min: 0, max: 100 },
  cooldownDays: { type: Number, required: true, min: 0, default: 14 },
  maxAttempts: { type: Number, required: true, min: 1, default: 2 },
  tierBands: { type: tierBandsSchema, required: true },
  questions: { type: [questionSchema], required: true, default: [] },
}, { collection: "tests", strict: "throw", timestamps: true });

testSchema.index({ taxonomySlug: 1 }, { unique: true, name: "tests_taxonomy_slug_unique" });

export const TestModel = (models.Test as Model<TestRecord> | undefined) ?? model<TestRecord>("Test", testSchema);
