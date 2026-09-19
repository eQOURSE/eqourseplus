import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  Types,
  type ClientSession,
  type Model,
} from "mongoose";

import { AUDIT_LOG_MODEL_NAME } from "./company-review.constants";
import type {
  AuditLogDocument,
  AuditLogRecord,
} from "./audit-log.schema";

export interface AuditLogStore {
  insert(
    entry: Omit<AuditLogRecord, "actorUserId" | "subjectId"> & {
      actorUserId: string;
      subjectId: string;
    },
    session: ClientSession,
  ): Promise<AuditLogDocument>;
  findBySubject(
    subjectCollection: "vendors" | "clients",
    subjectId: string,
  ): Promise<AuditLogDocument[]>;
}

@Injectable()
export class MongooseAuditLogStore implements AuditLogStore {
  constructor(
    @InjectModel(AUDIT_LOG_MODEL_NAME)
    private readonly model: Model<AuditLogRecord>,
  ) {}

  async insert(
    entry: Omit<AuditLogRecord, "actorUserId" | "subjectId"> & {
      actorUserId: string;
      subjectId: string;
    },
    session: ClientSession,
  ): Promise<AuditLogDocument> {
    const [created] = await this.model.create(
      [
        {
          ...entry,
          actorUserId: new Types.ObjectId(entry.actorUserId),
          subjectId: new Types.ObjectId(entry.subjectId),
        },
      ],
      { session },
    );
    if (!created) throw new Error("Audit entry was not created");
    return created;
  }

  findBySubject(
    subjectCollection: "vendors" | "clients",
    subjectId: string,
  ): Promise<AuditLogDocument[]> {
    return this.model
      .find({
        subjectCollection,
        subjectId: new Types.ObjectId(subjectId),
      })
      .sort({ occurredAt: 1 })
      .exec();
  }
}
