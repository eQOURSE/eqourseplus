import { Injectable } from "@nestjs/common";
import { ProfileState, type ProfileDraftInput } from "@eqourse/shared";
import { Types, type ClientSession } from "mongoose";

import { ProfileModel, type ProfileDocument } from "./profile.schema";

export interface ProfileStore {
  findByUserId(userId: string): Promise<ProfileDocument | null>;
  updateDraft(userId: string, patch: ProfileDraftInput): Promise<ProfileDocument | null>;
  ensureForUser(userId: string, session?: ClientSession): Promise<void>;
}

@Injectable()
export class MongooseProfileStore implements ProfileStore {
  findByUserId(userId: string): Promise<ProfileDocument | null> {
    return ProfileModel.findOne({ userId: new Types.ObjectId(userId) }).exec() as Promise<ProfileDocument | null>;
  }

  updateDraft(
    userId: string,
    patch: ProfileDraftInput,
  ): Promise<ProfileDocument | null> {
    if (Object.keys(patch).length === 0) return this.findByUserId(userId);
    return ProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), state: ProfileState.DRAFT },
      { $set: patch },
      { returnDocument: "after", runValidators: true },
    ).exec() as Promise<ProfileDocument | null>;
  }

  async ensureForUser(userId: string, session?: ClientSession): Promise<void> {
    await ProfileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          state: ProfileState.DRAFT,
        },
      },
      { upsert: true, session },
    ).exec();
  }
}
