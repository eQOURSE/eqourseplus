import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientState, type ClientDraftInput } from "@eqourse/shared";
import { Types, type Model } from "mongoose";

import { CLIENT_MODEL_NAME } from "./client.constants";
import type { ClientDocument, ClientRecord } from "./client.schema";

export interface ClientStore {
  findByOwner(ownerUserId: string): Promise<ClientDocument | null>;
  createDraft(ownerUserId: string): Promise<ClientDocument>;
  updateDraft(ownerUserId: string, patch: ClientDraftInput): Promise<ClientDocument>;
  markSubmitted(clientId: Types.ObjectId, submittedAt: Date): Promise<ClientDocument | null>;
}

@Injectable()
export class MongooseClientStore implements ClientStore {
  constructor(
    @InjectModel(CLIENT_MODEL_NAME)
    private readonly model: Model<ClientRecord>,
  ) {}

  findByOwner(ownerUserId: string): Promise<ClientDocument | null> {
    return this.model.findOne({ ownerUserId: new Types.ObjectId(ownerUserId) }).exec() as Promise<ClientDocument | null>;
  }

  async createDraft(ownerUserId: string): Promise<ClientDocument> {
    const existing = await this.findByOwner(ownerUserId);
    if (existing) return existing;
    return this.model.create({
      ownerUserId: new Types.ObjectId(ownerUserId),
      state: ClientState.DRAFT,
    }) as Promise<ClientDocument>;
  }

  async updateDraft(ownerUserId: string, patch: ClientDraftInput): Promise<ClientDocument> {
    const updated = await this.model.findOneAndUpdate(
      {
        ownerUserId: new Types.ObjectId(ownerUserId),
        state: { $in: [ClientState.DRAFT, ClientState.MORE_INFO_NEEDED] },
      },
      { $set: patch },
      { returnDocument: "after", runValidators: true },
    ).exec();
    if (!updated) throw new NotFoundException("Client not found");
    return updated as unknown as ClientDocument;
  }

  async markSubmitted(clientId: Types.ObjectId, submittedAt: Date): Promise<ClientDocument | null> {
    const updated = await this.model.findOneAndUpdate(
      {
        _id: clientId,
        state: { $in: [ClientState.DRAFT, ClientState.MORE_INFO_NEEDED] },
      },
      [
        {
          $set: {
            state: ClientState.SUBMITTED,
            submittedAt: { $ifNull: ["$submittedAt", submittedAt] },
            updatedAt: new Date(),
          },
        },
      ],
      { returnDocument: "after", updatePipeline: true },
    ).exec();
    return updated as unknown as ClientDocument | null;
  }
}
