import { Schema, Types, type HydratedDocument } from "mongoose";

export interface AuditLogRecord {
  actorUserId: Types.ObjectId;
  actor?: string;
  subjectCollection: "vendors" | "clients" | "profiles" | "users";
  subjectId: Types.ObjectId;
  subjectEmail?: string;
  role?: string;
  businessUnit?: string;
  fromState: string;
  toState: string;
  reason: string;
  occurredAt: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLogRecord>;

export const auditLogSchema = new Schema<AuditLogRecord>(
  {
    actorUserId: { type: Schema.Types.ObjectId, required: true },
    actor: { type: String, trim: true },
    subjectCollection: {
      type: String,
      enum: ["vendors", "clients", "profiles", "users"],
      required: true,
    },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    subjectEmail: { type: String, trim: true },
    role: { type: String, trim: true },
    businessUnit: { type: String, trim: true },
    fromState: { type: String, required: true },
    toState: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    occurredAt: { type: Date, required: true },
  },
  {
    collection: "auditLogs",
    strict: "throw",
    versionKey: false,
  },
);

auditLogSchema.index({ subjectCollection: 1, subjectId: 1, occurredAt: 1 });
auditLogSchema.index({ actorUserId: 1, occurredAt: 1 });
