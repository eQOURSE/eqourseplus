import { VendorState } from "@eqourse/shared";
import { Schema, Types, type HydratedDocument } from "mongoose";

export interface VendorRecord {
  ownerUserId: Types.ObjectId;
  state: VendorState;
  legalName?: string;
  tradingName?: string;
  countryCode?: string;
  registeredAddress?: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode: string;
    countryCode: string;
  };
  contactPerson?: {
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
  bankDetails?: {
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

const omitNull = <T>(value: T | null | undefined): T | undefined =>
  value === null || value === undefined ? undefined : value;

const registeredAddressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, set: omitNull },
    city: { type: String, required: true, trim: true },
    region: { type: String, trim: true, set: omitNull },
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
    scheme: { type: String, required: true, trim: true, set: omitNull },
    value: { type: String, required: true, trim: true, set: omitNull },
    lookupDigest: { type: String, required: true, set: omitNull },
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
    bankIdentifier: { type: bankIdentifierSchema, set: omitNull },
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
    legalName: { type: String, trim: true, set: omitNull },
    tradingName: { type: String, trim: true, set: omitNull },
    countryCode: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}$/,
      index: true,
      set: omitNull,
    },
    registeredAddress: { type: registeredAddressSchema, set: omitNull },
    contactPerson: { type: contactPersonSchema, set: omitNull },
    capabilities: {
      type: [capabilitySchema],
      default: [],
    },
    countryIdentifiers: {
      type: [countryIdentifierSchema],
      default: [],
    },
    bankDetails: { type: bankDetailsSchema, set: omitNull },
    documents: {
      type: [documentSchema],
      default: [],
    },
    submittedAt: { type: Date, set: omitNull },
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
