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
    submittedAt?: Date,
  ): Promise<ProfileDocument | null>;
  transitionStateById(
    id: string,
    fromState: ProfileState,
    toState: ProfileState,
    session: ClientSession,
  ): Promise<ProfileDocument | null>;
  findById(id: string, session?: ClientSession): Promise<ProfileDocument | null>;
  findReviewQueue(): Promise<ProfileDocument[]>;
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
    submittedAt?: Date,
  ): Promise<ProfileDocument | null> {
    const set: Record<string, unknown> = { state: toState };
    if (submittedAt) set.submittedAt = submittedAt;
    return ProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), state: fromState },
      { $set: set },
      { returnDocument: "after", includeResultMetadata: false, runValidators: true, session },
    ).exec() as Promise<ProfileDocument | null>;
  }

  findById(id: string, session?: ClientSession): Promise<ProfileDocument | null> {
    const query = ProfileModel.findById(new Types.ObjectId(id));
    if (session) query.session(session);
    return query.exec() as Promise<ProfileDocument | null>;
  }

  transitionStateById(
    id: string,
    fromState: ProfileState,
    toState: ProfileState,
    session: ClientSession,
  ): Promise<ProfileDocument | null> {
    return ProfileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), state: fromState },
      { $set: { state: toState } },
      { returnDocument: "after", includeResultMetadata: false, runValidators: true, session },
    ).exec() as Promise<ProfileDocument | null>;
  }

  findReviewQueue(): Promise<ProfileDocument[]> {
    return ProfileModel.find({
      state: { $in: [ProfileState.SUBMITTED, ProfileState.UNDER_REVIEW] },
    })
      .select({ _id: 1, state: 1, submittedAt: 1, updatedAt: 1, createdAt: 1 })
      .sort({ submittedAt: 1, _id: 1 })
      .exec() as Promise<ProfileDocument[]>;
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
