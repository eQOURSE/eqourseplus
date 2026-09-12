import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { VendorState } from "@eqourse/shared";
import type { VendorDraftInput } from "@eqourse/shared";
import { Types, type Model } from "mongoose";

import {
  VENDOR_MODEL_NAME,
} from "./vendor.constants";
import type { VendorDocument, VendorRecord } from "./vendor.schema";

export const VENDOR_STORE = Symbol("VENDOR_STORE");

export interface VendorStore {
  findByOwner(ownerUserId: string): Promise<VendorDocument | null>;
  createDraft(ownerUserId: string): Promise<VendorDocument>;
  updateDraft(ownerUserId: string, patch: VendorDraftInput): Promise<VendorDocument>;
  markSubmitted(ownerUserId: string, submittedAt: Date): Promise<VendorDocument>;
}

@Injectable()
export class MongooseVendorStore implements VendorStore {
  constructor(
    @InjectModel(VENDOR_MODEL_NAME)
    private readonly model: Model<VendorRecord>,
  ) {}

  findByOwner(ownerUserId: string): Promise<VendorDocument | null> {
    return this.model.findOne({ ownerUserId: new Types.ObjectId(ownerUserId) }).exec() as Promise<VendorDocument | null>;
  }

  async createDraft(ownerUserId: string): Promise<VendorDocument> {
    const existing = await this.findByOwner(ownerUserId);
    if (existing) return existing;
    return this.model.create({
      ownerUserId: new Types.ObjectId(ownerUserId),
      state: VendorState.DRAFT,
    }) as Promise<VendorDocument>;
  }

  async updateDraft(ownerUserId: string, patch: VendorDraftInput): Promise<VendorDocument> {
    const updated = await this.model.findOneAndUpdate(
      { ownerUserId: new Types.ObjectId(ownerUserId), state: { $in: [VendorState.DRAFT, VendorState.MORE_INFO_NEEDED] } },
      { $set: patch },
      { new: true, runValidators: true },
    ).exec();
    if (!updated) throw new NotFoundException("Vendor not found");
    return updated as unknown as VendorDocument;
  }

  async markSubmitted(ownerUserId: string, submittedAt: Date): Promise<VendorDocument> {
    const vendor = await this.findByOwner(ownerUserId);
    if (!vendor) throw new NotFoundException("Vendor not found");
    const update = vendor.submittedAt
      ? { $set: { state: VendorState.SUBMITTED } }
      : { $set: { state: VendorState.SUBMITTED, submittedAt } };
    const updated = await this.model.findOneAndUpdate(
      { _id: vendor._id },
      update,
      { new: true, runValidators: true },
    ).exec();
    if (!updated) throw new NotFoundException("Vendor not found");
    return updated as unknown as VendorDocument;
  }
}
