import { VendorState } from "@eqourse/shared";
import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface VendorRecord {
  ownerUserId: Schema.Types.ObjectId;
  state: VendorState;
  legalName: string;
  tradingName?: string;
  countryCode: string;
  registeredAddress: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode: string;
    countryCode: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  capabilities: Array<{ taxonomySlug: string }>;
  countryIdentifiers: Array<{
    scheme: string;
    value: string;
    lookupDigest: string;
  }>;
  bankDetails: {
    accountHolderName: string;
    bankCountryCode: string;
    currencyCode: string;
    accountIdentifier: { scheme: string; value: string };
    bankIdentifier?: { scheme: string; value: string };
  };
  documents: Array<{
    kind: string;
    objectKey: string;
    uploadedAt: Date;
  }>;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type VendorDocument = HydratedDocument<VendorRecord>;

const registeredAddressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    region: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}$/,
    },
  },
  { _id: false, strict: "throw" },
);

const contactPersonSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false, strict: "throw" },
);

const capabilitySchema = new Schema(
  {
    taxonomySlug: { type: String, required: true, trim: true },
  },
  { _id: false, strict: "throw" },
);

const countryIdentifierSchema = new Schema(
  {
    scheme: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    lookupDigest: { type: String, required: true },
  },
  { _id: false, strict: "throw" },
);

const accountIdentifierSchema = new Schema(
  {
    scheme: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false, strict: "throw" },
);

const bankIdentifierSchema = new Schema(
  {
    scheme: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false, strict: "throw" },
);

const bankDetailsSchema = new Schema(
  {
    accountHolderName: { type: String, required: true, trim: true },
    bankCountryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}$/,
    },
    currencyCode: { type: String, required: true, uppercase: true, trim: true },
    accountIdentifier: { type: accountIdentifierSchema, required: true },
    bankIdentifier: { type: bankIdentifierSchema },
  },
  { _id: false, strict: "throw" },
);

const documentSchema = new Schema(
  {
    kind: { type: String, required: true, trim: true },
    objectKey: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false, strict: "throw" },
);

export const vendorSchema = new Schema<VendorRecord>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, required: true },
    state: {
      type: String,
      enum: Object.values(VendorState),
      required: true,
      default: VendorState.DRAFT,
      index: true,
    },
    legalName: { type: String, required: true, trim: true },
    tradingName: { type: String, trim: true },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}$/,
      index: true,
    },
    registeredAddress: { type: registeredAddressSchema, required: true },
    contactPerson: { type: contactPersonSchema, required: true },
    capabilities: {
      type: [capabilitySchema],
      required: true,
      default: [],
    },
    countryIdentifiers: {
      type: [countryIdentifierSchema],
      required: true,
      default: [],
    },
    bankDetails: { type: bankDetailsSchema, required: true },
    documents: {
      type: [documentSchema],
      required: true,
      default: [],
    },
    submittedAt: { type: Date },
  },
  {
    collection: "vendors",
    strict: "throw",
    timestamps: true,
    versionKey: false,
  },
);

vendorSchema.index({ ownerUserId: 1 });
vendorSchema.index({ "capabilities.taxonomySlug": 1 });
vendorSchema.index(
  { "countryIdentifiers.lookupDigest": 1 },
  { unique: true, sparse: true },
);
vendorSchema.index({ state: 1, submittedAt: 1 });

export const VendorModel =
  (models.Vendor as Model<VendorRecord> | undefined) ??
  model<VendorRecord>("Vendor", vendorSchema);
