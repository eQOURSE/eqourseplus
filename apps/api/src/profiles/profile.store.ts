import { Injectable } from "@nestjs/common";
import { ProfileState, type ProfileDraftInput } from "@eqourse/shared";
import { Types, type ClientSession } from "mongoose";

import { ProfileModel, type ProfileDocument } from "./profile.schema";

export interface ProfileStore {
  findByUserId(userId: string, session?: ClientSession): Promise<ProfileDocument | null>;
  updateDraft(userId: string, patch: ProfileDraftInput): Promise<ProfileDocument | null>;
  transitionState(
    userId: string,
    fromState: ProfileState,
    toState: ProfileState,
    session: ClientSession,
  ): Promise<ProfileDocument | null>;
  ensureForUser(userId: string, session?: ClientSession): Promise<void>;
}

@Injectable()
export class MongooseProfileStore implements ProfileStore {
  findByUserId(userId: string, session?: ClientSession): Promise<ProfileDocument | null> {
    const query = ProfileModel.findOne({ userId: new Types.ObjectId(userId) });
    if (session) query.session(session);
    return query.exec() as Promise<ProfileDocument | null>;
  }

  transitionState(
    userId: string,
    fromState: ProfileState,
    toState: ProfileState,
    session: ClientSession,
  ): Promise<ProfileDocument | null> {
    return ProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), state: fromState },
      { $set: { state: toState } },
      { returnDocument: "after", includeResultMetadata: false, runValidators: true, session },
    ).exec() as Promise<ProfileDocument | null>;
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
