import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
  canTransitionProfile,
  calculateProfileCompletionPercentage,
  ProfileState,
  profileSubmissionSchema,
  profileReviewDecisionSchema,
  type ProfileSampleUploadRequest,
  type ProfileSampleUploadResponse,
  type ProfileDraftInput,
  type ProfileReviewDecisionInput,
} from "@eqourse/shared";
import type { StorageAdapter } from "@eqourse/adapters";
import { Types, type Connection, type ClientSession } from "mongoose";
import { createCompanyUpload } from "../company-registration/company-registration";
import { AUDIT_LOG_STORE } from "../company-reviews/company-review.constants";
import type { AuditLogStore } from "../company-reviews/audit-log.store";

import { SkillTaxonomyModel } from "../database/skill-taxonomy.schema";
import { PROFILE_STORAGE_ADAPTER, PROFILE_STORE } from "./profile.constants";
import type { ProfileDocument } from "./profile.schema";
import type { ProfileStore } from "./profile.store";

@Injectable()
export class ProfileService {
  constructor(
    @Inject(PROFILE_STORE) private readonly store: ProfileStore,
    @Inject(PROFILE_STORAGE_ADAPTER) private readonly storage: StorageAdapter,
    @Inject(AUDIT_LOG_STORE) private readonly auditLogs: AuditLogStore,
    @InjectConnection() private readonly database: Connection,
  ) {}

  async readOwn(userId: string) {
    const profile = await this.profile(userId);
    return this.response(profile);
  }

  async save(userId: string, input: ProfileDraftInput) {
    const current = await this.profile(userId);
    if (current.state !== ProfileState.DRAFT) {
      throw new BadRequestException("Profile cannot be edited in its current state");
    }
    await this.assertTaxonomySlugs(input);
    this.assertSampleKeys(current, input);
    const updated = await this.store.updateDraft(userId, input);
    if (!updated) throw new NotFoundException("Profile not found");
    return this.response(updated);
  }

  async createSampleUpload(
    userId: string,
    input: ProfileSampleUploadRequest,
  ): Promise<ProfileSampleUploadResponse> {
    const profile = await this.profile(userId);
    if (profile.state !== ProfileState.DRAFT) {
      throw new BadRequestException("Profile samples cannot be changed in its current state");
    }
    return createCompanyUpload(
      this.storage,
      `profiles/${profile._id.toString()}/samples/`,
      input,
    );
  }

  async submit(userId: string) {
    const current = await this.profile(userId);
    const value = current.toObject({ versionKey: false });
    const parsed = profileSubmissionSchema.safeParse({
      resumeSection: value.resumeSection,
      personal: value.personal,
      education: value.education,
      skills: value.skills,
      languages: value.languages,
      experience: value.experience,
      samples: value.samples,
      availability: value.availability,
      rate: value.rate,
    });
    if (!parsed.success) {
      throw new BadRequestException("Complete every required profile section before submitting");
    }
    if (!canTransitionProfile(current.state, ProfileState.SUBMITTED)) {
      throw new BadRequestException("Profile cannot be submitted in its current state");
    }

    let session: ClientSession;
    try {
      session = await this.database.startSession();
    } catch {
      throw new ServiceUnavailableException("Profile transition could not be audit-logged");
    }
    let submitted: ProfileDocument | null = null;
    try {
      await session.withTransaction(async () => {
        submitted = await this.store.transitionState(
          userId,
          current.state,
          ProfileState.SUBMITTED,
          session,
          current.state === ProfileState.DRAFT ? new Date() : undefined,
        );
        if (!submitted) {
          throw new BadRequestException("Profile state changed before submission could be applied");
        }
        await this.auditLogs.insert({
          actorUserId: userId,
          subjectCollection: "profiles",
          subjectId: submitted._id.toString(),
          fromState: current.state,
          toState: ProfileState.SUBMITTED,
          reason: "Profile submitted by the account holder for review.",
          occurredAt: new Date(),
        }, session);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException("Profile transition could not be audit-logged");
    } finally {
      await session.endSession().catch(() => undefined);
    }
    if (!submitted) throw new ServiceUnavailableException("Profile transition could not be audit-logged");
    return this.response(submitted);
  }

  async reviewQueue() {
    return (await this.store.findReviewQueue()).map((profile) => {
      // Legacy submitted profiles may predate submittedAt. updatedAt is the migration's
      // documented proxy; createdAt keeps the queue usable if both fields are legacy-missing.
      const submittedAt = profile.submittedAt ?? profile.updatedAt ?? profile.createdAt;
      return {
        id: profile._id.toHexString(),
        state: profile.state,
        submittedAt: submittedAt.toISOString(),
      };
    });
  }

  async reviewDetail(id: string) {
    this.assertObjectId(id);
    const profile = await this.store.findById(id);
    if (!profile || ![ProfileState.SUBMITTED, ProfileState.UNDER_REVIEW].includes(profile.state)) {
      throw new NotFoundException("Profile is not available for review");
    }
    return this.response(profile);
  }

  async decideReview(id: string, actorUserId: string, input: ProfileReviewDecisionInput) {
    const parsed = profileReviewDecisionSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("Invalid profile review decision");
    let session: ClientSession;
    try {
      session = await this.database.startSession();
    } catch {
      throw new ServiceUnavailableException("Profile transition could not be audit-logged");
    }
    let decided: ProfileDocument | null = null;
    try {
      await session.withTransaction(async () => {
        this.assertObjectId(id);
        const current = await this.store.findById(id, session);
        if (!current || ![ProfileState.SUBMITTED, ProfileState.UNDER_REVIEW].includes(current.state)) {
          throw new NotFoundException("Profile is not available for review");
        }
        this.assertReasonHasNoReviewedPii(input.reason, current);
        const toState = profileReviewTarget(current.state, input.decision);
        decided = await this.store.transitionStateById(id, current.state, toState, session);
        if (!decided) throw new BadRequestException("Profile state changed before this decision could be applied");
        await this.auditLogs.insert({
          actorUserId,
          subjectCollection: "profiles",
          subjectId: id,
          fromState: current.state,
          toState,
          reason: input.reason,
          occurredAt: new Date(),
        }, session);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException("Profile transition could not be audit-logged");
    } finally {
      await session.endSession().catch(() => undefined);
    }
    if (!decided) throw new ServiceUnavailableException("Profile transition could not be audit-logged");
    return this.response(decided);
  }

  private assertSampleKeys(
    profile: ProfileDocument,
    input: ProfileDraftInput,
  ): void {
    if (!input.samples) return;
    const prefix = `profiles/${profile._id.toString()}/samples/`;
    for (const sample of input.samples) {
      if (sample.objectKey !== undefined && !sample.objectKey.startsWith(prefix)) {
        throw new BadRequestException("Sample key does not belong to this profile");
      }
    }
  }

  private async profile(userId: string): Promise<ProfileDocument> {
    const profile = await this.store.findByUserId(userId);
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  private async assertTaxonomySlugs(input: ProfileDraftInput): Promise<void> {
    const slugs = [
      ...new Set(
        (input.skills ?? [])
          .map((skill) => skill.taxonomySlug)
          .filter((slug): slug is string => slug !== undefined),
      ),
    ];
    if (slugs.length === 0) return;
    const count = await SkillTaxonomyModel.countDocuments({ slug: { $in: slugs } }).exec();
    if (count !== slugs.length) {
      throw new BadRequestException("Every selected skill must exist in the taxonomy");
    }
  }

  private response(profile: ProfileDocument) {
    const value = profile.toObject({ versionKey: false });
    return {
      ...value,
      completionPercentage: calculateProfileCompletionPercentage(value),
    };
  }

  private assertObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid profile ID");
  }

  private assertReasonHasNoReviewedPii(reason: string, profile: ProfileDocument): void {
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(reason)) {
      throw new BadRequestException("Reason must not contain an email address");
    }
    if (/(?:^|\s)\+?\d[\d\s().-]{7,}\d(?=\s|$)/.test(reason)) {
      throw new BadRequestException("Reason must not contain a phone number");
    }
    const normalizedReason = normalize(reason);
    if (collectReviewedIdentifiers(profile.toObject()).some((value) => {
      const normalizedValue = normalize(value);
      return normalizedValue.length >= 5 && normalizedReason.includes(normalizedValue);
    })) {
      throw new BadRequestException("Reason must not copy a value from the reviewed profile");
    }
  }
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function collectReviewedIdentifiers(value: unknown, key = ""): string[] {
  if (typeof value === "string") {
    return /firstName|lastName|email|phone|address|objectKey|fileName|filename/i.test(key) ? [value] : [];
  }
  if (Array.isArray(value)) return value.flatMap((entry) => collectReviewedIdentifiers(entry, key));
  if (value !== null && typeof value === "object" && !(value instanceof Date) && !(value instanceof Types.ObjectId)) {
    return Object.entries(value).flatMap(([entryKey, entry]) => collectReviewedIdentifiers(entry, entryKey));
  }
  return [];
}

function profileReviewTarget(
  fromState: ProfileState,
  decision: ProfileReviewDecisionInput["decision"],
): ProfileState {
  const target = decision === "START_REVIEW"
    ? ProfileState.UNDER_REVIEW
    : decision === "APPROVE"
      ? ProfileState.TEST_PENDING
      : decision === "REJECT"
        ? ProfileState.REJECTED
        : ProfileState.MORE_INFO_NEEDED;
  if (!canTransitionProfile(fromState, target)) {
    throw new BadRequestException("Decision is not permitted in the current profile state");
  }
  return target;
}
