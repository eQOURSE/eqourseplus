import { BusinessUnit } from "@eqourse/shared";
import { model, models, Schema, type Model } from "mongoose";

export enum SkillTaxonomyStatus {
  ACTIVE = "ACTIVE",
  DEPRECATED = "DEPRECATED",
}

export interface SkillTaxonomyRecord {
  businessUnit: BusinessUnit;
  serviceLine: string;
  skill: string;
  specialization?: string | null;
  slug: string;
  status: SkillTaxonomyStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const skillTaxonomySchema = new Schema<SkillTaxonomyRecord>(
  {
    businessUnit: {
      type: String,
      enum: Object.values(BusinessUnit),
      required: true,
    },
    serviceLine: { type: String, required: true, trim: true },
    skill: { type: String, required: true, trim: true },
    specialization: { type: String, default: null, trim: true },
    slug: {
      type: String,
      required: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    status: {
      type: String,
      enum: Object.values(SkillTaxonomyStatus),
      required: true,
      default: SkillTaxonomyStatus.ACTIVE,
    },
    version: { type: Number, required: true, min: 1, default: 1 },
  },
  {
    collection: "skillTaxonomy",
    strict: "throw",
    timestamps: true,
    versionKey: false,
  },
);

skillTaxonomySchema.index({ slug: 1 }, { unique: true });
skillTaxonomySchema.index(
  { businessUnit: 1, serviceLine: 1, skill: 1, specialization: 1 },
  { unique: true },
);
skillTaxonomySchema.index({ status: 1 });

export const SkillTaxonomyModel =
  (models.SkillTaxonomy as Model<SkillTaxonomyRecord> | undefined) ??
  model<SkillTaxonomyRecord>("SkillTaxonomy", skillTaxonomySchema);
