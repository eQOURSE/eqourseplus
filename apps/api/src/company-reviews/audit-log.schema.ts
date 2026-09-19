import { Schema, Types, type HydratedDocument } from "mongoose";

export interface AuditLogRecord {
  actorUserId: Types.ObjectId;
  subjectCollection: "vendors" | "clients";
  subjectId: Types.ObjectId;
  fromState: string;
  toState: string;
  reason: string;
  occurredAt: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLogRecord>;

export const auditLogSchema = new Schema<AuditLogRecord>(
  {
    actorUserId: { type: Schema.Types.ObjectId, required: true },
    subjectCollection: {
      type: String,
      enum: ["vendors", "clients"],
      required: true,
    },
    subjectId: { type: Schema.Types.ObjectId, required: true },
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
