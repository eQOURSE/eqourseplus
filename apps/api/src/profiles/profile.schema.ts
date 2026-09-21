import { ProfileSection, ProfileState } from "@eqourse/shared";
import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

export interface ProfileRecord {
  userId: Types.ObjectId;
  state: ProfileState;
  resumeSection?: ProfileSection;
  personal?: Record<string, unknown>;
  education?: Array<Record<string, unknown>>;
  skills?: Array<Record<string, unknown>>;
  languages?: Array<Record<string, unknown>>;
  experience?: Record<string, unknown>;
  samples?: Array<Record<string, unknown>>;
  availability?: Record<string, unknown>;
  rate?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileDocument = HydratedDocument<ProfileRecord>;

const optionalText = { type: String, trim: true } as const;
const currentYear = new Date().getUTCFullYear();
const optionalArray = (schema: Schema) => ({ type: [schema], default: undefined });

const personalSchema = new Schema(
  {
    firstName: optionalText,
    lastName: optionalText,
    headline: optionalText,
    city: optionalText,
  },
  { _id: false, strict: "throw" },
);
const educationSchema = new Schema(
  {
    institution: optionalText,
    qualification: optionalText,
    fieldOfStudy: optionalText,
    startYear: { type: Number, min: 1900, max: currentYear + 10 },
    endYear: {
      type: Number,
      min: 1900,
      max: currentYear + 10,
      validate: {
        validator(this: { startYear?: number }, value?: number) {
          return value === undefined || this.startYear === undefined || value >= this.startYear;
        },
        message: "End year cannot be earlier than start year",
      },
    },
  },
  { _id: false, strict: "throw" },
);
const skillSchema = new Schema(
  {
    taxonomySlug: optionalText,
    level: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
    },
  },
  { _id: false, strict: "throw" },
);
const languageSchema = new Schema(
  {
    languageCode: optionalText,
    proficiency: {
      type: String,
      enum: ["BASIC", "CONVERSATIONAL", "PROFESSIONAL", "NATIVE"],
    },
  },
  { _id: false, strict: "throw" },
);
const experienceEntrySchema = new Schema(
  {
    organization: optionalText,
    title: optionalText,
    startDate: { type: Date },
    endDate: {
      type: Date,
      validate: {
        validator(this: { startDate?: Date }, value?: Date) {
          return value === undefined || this.startDate === undefined || value >= this.startDate;
        },
        message: "End date cannot be earlier than start date",
      },
    },
    summary: optionalText,
  },
  { _id: false, strict: "throw" },
);
const experienceSchema = new Schema(
  {
    totalMonths: { type: Number, min: 0, max: 960 },
    entries: optionalArray(experienceEntrySchema),
  },
  { _id: false, strict: "throw" },
);
const sampleSchema = new Schema(
  { title: optionalText, objectKey: optionalText, uploadedAt: { type: Date } },
  { _id: false, strict: "throw" },
);
const availabilitySchema = new Schema(
  {
    availableFrom: { type: Date },
    weeklyHours: { type: Number, min: 1, max: 168 },
    timeZone: optionalText,
  },
  { _id: false, strict: "throw" },
);
const rateSchema = new Schema(
  {
    amountMinor: { type: Number, min: 1 },
    currencyCode: { type: String, match: /^[A-Z]{3}$/ },
    unit: { type: String, enum: ["HOUR"] },
  },
  { _id: false, strict: "throw" },
);

export const profileSchema = new Schema<ProfileRecord>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    state: {
      type: String,
      enum: Object.values(ProfileState),
      required: true,
      default: ProfileState.DRAFT,
    },
    resumeSection: { type: String, enum: Object.values(ProfileSection) },
    personal: { type: personalSchema },
    education: optionalArray(educationSchema),
    skills: optionalArray(skillSchema),
    languages: optionalArray(languageSchema),
    experience: { type: experienceSchema },
    samples: optionalArray(sampleSchema),
    availability: { type: availabilitySchema },
    rate: { type: rateSchema },
  },
  {
    collection: "profiles",
    strict: "throw",
    timestamps: true,
    versionKey: false,
  },
);

profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ state: 1 });
profileSchema.index({ "skills.taxonomySlug": 1 });
profileSchema.index({ state: 1, updatedAt: 1 });

export const ProfileModel =
  (models.Profile as Model<ProfileRecord> | undefined) ??
  model<ProfileRecord>("Profile", profileSchema);
