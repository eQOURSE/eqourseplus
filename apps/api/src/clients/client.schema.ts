import { ClientState } from "@eqourse/shared";
import { Schema, Types, type HydratedDocument } from "mongoose";

export interface ClientRecord {
  ownerUserId: Types.ObjectId;
  state: ClientState;
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
  website?: string;
  contactPerson?: { name: string; email: string; phone: string };
  authorisedPerson?: {
    name: string;
    governmentIdentityDocument?: {
      kind: string;
      objectKey: string;
      uploadedAt: Date;
    };
  };
  countryIdentifiers: Array<{ scheme: string; value: string; lookupDigest: string }>;
  documents: Array<{ kind: string; objectKey: string; uploadedAt: Date }>;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientDocument = HydratedDocument<ClientRecord>;

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

const documentSchema = new Schema(
  {
    kind: { type: String, required: true, trim: true },
    objectKey: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false, strict: "throw" },
);

const authorisedPersonSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    governmentIdentityDocument: { type: documentSchema, set: omitNull },
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

export const clientSchema = new Schema<ClientRecord>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, required: true },
    state: {
      type: String,
      enum: Object.values(ClientState),
      required: true,
      default: ClientState.DRAFT,
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
    website: { type: String, trim: true, set: omitNull },
    contactPerson: { type: contactPersonSchema, set: omitNull },
    authorisedPerson: { type: authorisedPersonSchema, set: omitNull },
    countryIdentifiers: { type: [countryIdentifierSchema], default: [] },
    documents: { type: [documentSchema], default: [] },
    submittedAt: { type: Date, set: omitNull },
  },
  {
    collection: "clients",
    strict: "throw",
    timestamps: true,
    versionKey: false,
  },
);

clientSchema.index({ ownerUserId: 1 });
clientSchema.index(
  { "countryIdentifiers.lookupDigest": 1 },
  { unique: true, sparse: true },
);
clientSchema.index({ state: 1, submittedAt: 1 });
