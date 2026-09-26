import { randomInt } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import type { BusinessUnit } from "@eqourse/shared";
import { LiteProctoringAdapter, type ProctoringAdapter } from "@eqourse/adapters";
import { Inject, Optional } from "@nestjs/common";

import { SkillTaxonomyModel, SkillTaxonomyStatus } from "../database/skill-taxonomy.schema";
import { ProfileModel } from "../profiles/profile.schema";
import { AttemptStatus, TestAttemptModel, type TestAttemptRecord, type Tier, type ViolationKind } from "./test-attempt.schema";
import { TestModel, type TestQuestion, type TestRecord } from "./test.schema";

type Config = Omit<TestRecord, "questions">;
type Answer = { questionId: string; optionId: string };

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let n = result.length - 1; n > 0; n--) {
    const index = randomInt(n + 1);
    [result[n], result[index]] = [result[index]!, result[n]!];
  }
  return result;
}

function publicAttempt(attempt: TestAttemptRecord & { _id: Types.ObjectId }, serverNow: Date, remainingAttempts?: number) {
  return {
    id: attempt._id.toString(),
    taxonomySlug: attempt.taxonomySlug,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt.toISOString(),
    items: attempt.items.map((item) => ({
      questionId: item.questionId,
      prompt: item.prompt,
      options: item.options,
    })),
    scorePercent: attempt.scorePercent,
    tier: attempt.tier,
    violations: attempt.violations,
    remainingAttempts,
    serverNow: serverNow.toISOString(),
  };
}

@Injectable()
export class AssessmentService {
  constructor(
    @Optional() @Inject("ASSESSMENT_CLOCK")
    private readonly now: () => Date = () => new Date(),
    @Optional() @Inject("PROCTORING_ADAPTER")
    private readonly proctoring: ProctoringAdapter = new LiteProctoringAdapter(),
  ) {}

  async configure(config: Config): Promise<void> {
    const taxonomy = await SkillTaxonomyModel.exists({ slug: config.taxonomySlug, status: SkillTaxonomyStatus.ACTIVE });
    if (!taxonomy) throw new BadRequestException("Active taxonomy category required");
    if (config.tierBands.silverMinPercent > config.tierBands.goldMinPercent ||
      config.passThresholdPercent > config.tierBands.silverMinPercent) {
      throw new BadRequestException("Invalid score bands");
    }
    await TestModel.updateOne(
      { taxonomySlug: config.taxonomySlug },
      { $set: config, $setOnInsert: { questions: [] } },
      { upsert: true, runValidators: true },
    );
  }

  async addQuestion(slug: string, question: TestQuestion): Promise<void> {
    if (question.status !== "DRAFT") throw new BadRequestException("New questions must be DRAFT");
    if (question.options.length !== 4 || new Set(question.options.map((option) => option.id)).size !== 4 ||
      !question.options.some((option) => option.id === question.correctOptionId)) {
      throw new BadRequestException("MCQ requires four unique options and a matching answer");
    }
    const result = await TestModel.updateOne(
      { taxonomySlug: slug, "questions.id": { $ne: question.id } },
      { $push: { questions: question } },
    );
    if (result.modifiedCount !== 1) throw new ConflictException("Category missing or question ID exists");
  }

  async questionsForReview(slug: string) {
    const test = await TestModel.findOne({ taxonomySlug: slug }).lean();
    if (!test) throw new NotFoundException("Category test not configured");
    return test.questions;
  }

  async approveQuestion(slug: string, questionId: string): Promise<void> {
    const result = await TestModel.updateOne(
      { taxonomySlug: slug, "questions.id": questionId },
      { $set: { "questions.$.status": "APPROVED" } },
    );
    if (result.matchedCount !== 1) throw new NotFoundException("Question not found");
  }

  async eligibility(userId: string, slug: string) {
    const test = await TestModel.findOne({ taxonomySlug: slug }).lean();
    if (!test) throw new NotFoundException("Category test not configured");
    const attempts = await TestAttemptModel.find({ userId: new Types.ObjectId(userId), taxonomySlug: slug })
      .sort({ attemptNumber: -1 }).lean();
    const latest = attempts[0];
    const cooldownExpiry = latest
      ? new Date(latest.startedAt.getTime() + test.cooldownDays * 86_400_000)
      : null;
    return {
      remainingAttempts: Math.max(0, test.maxAttempts - attempts.length),
      cooldownExpiry: cooldownExpiry?.toISOString() ?? null,
      canStart: attempts.length < test.maxAttempts &&
        (!cooldownExpiry || this.now() >= cooldownExpiry) &&
        (latest?.status !== AttemptStatus.IN_PROGRESS || this.now() >= latest.expiresAt),
    };
  }

  async catalog(userId: string) {
    const tests = await TestModel.find({}, { taxonomySlug: 1, questionCount: 1, timeLimitSeconds: 1, questions: 1 }).lean();
    const available = tests.filter((test) => test.questions.filter((question) => question.status === "APPROVED").length >= test.questionCount);
    return Promise.all(available.map(async (test) => {
      const taxonomy = await SkillTaxonomyModel.findOne({ slug: test.taxonomySlug, status: SkillTaxonomyStatus.ACTIVE }).lean();
      if (!taxonomy) return null;
      return {
        taxonomySlug: test.taxonomySlug,
        title: taxonomy.specialization ?? taxonomy.skill,
        serviceLine: taxonomy.serviceLine,
        questionCount: test.questionCount,
        timeLimitSeconds: test.timeLimitSeconds,
        eligibility: await this.eligibility(userId, test.taxonomySlug),
      };
    })).then((rows) => rows.filter((row) => row !== null));
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await TestAttemptModel.findOne({ _id: attemptId, userId: new Types.ObjectId(userId) });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.status === AttemptStatus.IN_PROGRESS && this.now() >= attempt.expiresAt) {
      attempt.status = AttemptStatus.EXPIRED;
      await attempt.save();
    }
    return publicAttempt(attempt, this.now());
  }

  async start(userId: string, slug: string) {
    const test = await TestModel.findOne({ taxonomySlug: slug }).lean();
    if (!test) throw new NotFoundException("Category test not configured");
    const candidate = new Types.ObjectId(userId);
    if (!await ProfileModel.exists({ userId: candidate })) {
      throw new ConflictException("Submitted freelancer profile missing");
    }
    const latest = await TestAttemptModel.findOne({ userId: candidate, taxonomySlug: slug })
      .sort({ attemptNumber: -1 }).lean();
    const now = this.now();
    if (latest?.status === AttemptStatus.IN_PROGRESS && now < latest.expiresAt) {
      throw new ConflictException("Attempt already in progress");
    }
    if (latest?.status === AttemptStatus.IN_PROGRESS) {
      await TestAttemptModel.updateOne({ _id: latest._id, status: AttemptStatus.IN_PROGRESS }, { $set: { status: AttemptStatus.EXPIRED } });
    }
    const attemptNumber = (latest?.attemptNumber ?? 0) + 1;
    if (attemptNumber > test.maxAttempts) throw new ConflictException("Maximum attempts reached");
    if (latest && now.getTime() < latest.startedAt.getTime() + test.cooldownDays * 86_400_000) {
      throw new ConflictException("Retake cooldown has not expired");
    }
    const approved = test.questions.filter((question) => question.status === "APPROVED" && question.kind === "MCQ");
    if (approved.length < test.questionCount) throw new ConflictException("Insufficient approved questions");
    const items = shuffle(approved).slice(0, test.questionCount).map((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      options: shuffle(question.options),
      correctOptionId: question.correctOptionId,
    }));
    const attempt = await TestAttemptModel.create({
      userId: candidate,
      taxonomySlug: slug,
      attemptNumber,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: now,
      expiresAt: new Date(now.getTime() + test.timeLimitSeconds * 1000),
      passThresholdPercent: test.passThresholdPercent,
      tierBands: test.tierBands,
      items,
      answers: [],
      violations: [],
    });
    return publicAttempt(attempt, this.now(), test.maxAttempts - attemptNumber);
  }

  async recordViolation(userId: string, attemptId: string, kind: ViolationKind): Promise<void> {
    const result = await TestAttemptModel.updateOne({
      _id: attemptId,
      userId: new Types.ObjectId(userId),
      status: AttemptStatus.IN_PROGRESS,
      expiresAt: { $gt: this.now() },
    }, { $push: { violations: this.proctoring.recordEvent(kind, this.now()) } });
    if (result.modifiedCount !== 1) throw new ConflictException("Attempt closed or expired");
  }

  async submit(userId: string, attemptId: string, answers: Answer[]) {
    const attempt = await TestAttemptModel.findOne({ _id: attemptId, userId: new Types.ObjectId(userId) });
    if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) throw new ConflictException("Attempt closed or missing");
    const now = this.now();
    if (now >= attempt.expiresAt) {
      attempt.status = AttemptStatus.EXPIRED;
      await attempt.save();
      throw new ConflictException("Attempt time expired");
    }
    const ids = new Set(attempt.items.map((item) => item.questionId));
    if (answers.length > ids.size || new Set(answers.map((answer) => answer.questionId)).size !== answers.length ||
      answers.some((answer) => !ids.has(answer.questionId) ||
        !attempt.items.find((item) => item.questionId === answer.questionId)?.options.some((option) => option.id === answer.optionId))) {
      throw new BadRequestException("Invalid answers");
    }
    const correct = attempt.items.filter((item) => answers.some((answer) => answer.questionId === item.questionId && answer.optionId === item.correctOptionId)).length;
    const scorePercent = Math.round(100 * correct / attempt.items.length);
    const passed = scorePercent >= attempt.passThresholdPercent;
    const tier: Tier | undefined = passed
      ? scorePercent >= attempt.tierBands.goldMinPercent ? "GOLD" : scorePercent >= attempt.tierBands.silverMinPercent ? "SILVER" : "BRONZE"
      : undefined;
    attempt.answers = answers;
    attempt.scorePercent = scorePercent;
    attempt.submittedAt = now;
    attempt.status = attempt.violations.length ? AttemptStatus.UNDER_REVIEW : passed ? AttemptStatus.PASSED : AttemptStatus.FAILED;
    if (tier) attempt.tier = tier;
    await attempt.save();
    if (attempt.status === AttemptStatus.PASSED) await this.awardPassedAttempt(attempt._id.toString());
    return publicAttempt(attempt, this.now());
  }

  // FR-REG-06 may call this after its own guarded profile-state transition lands.
  async awardPassedAttempt(attemptId: string): Promise<void> {
    const attempt = await TestAttemptModel.findById(attemptId).lean();
    if (!attempt || attempt.status !== AttemptStatus.PASSED || !attempt.tier || attempt.scorePercent === undefined) {
      throw new ConflictException("Only an unflagged passed attempt can earn a badge");
    }
    const profile = await ProfileModel.findOne({ userId: attempt.userId });
    if (!profile) throw new ConflictException("Submitted freelancer profile missing");
    profile.assessmentBadges = profile.assessmentBadges.filter((badge) => badge.taxonomySlug !== attempt.taxonomySlug);
    profile.assessmentBadges.push({
      taxonomySlug: attempt.taxonomySlug,
      tier: attempt.tier,
      scorePercent: attempt.scorePercent,
      awardedAt: attempt.submittedAt ?? this.now(),
    });
    await profile.save();
  }

  async report(attemptId: string) {
    const attempt = await TestAttemptModel.findById(attemptId).lean();
    if (!attempt) throw new NotFoundException("Attempt not found");
    return publicAttempt(attempt, this.now());
  }

  async badge(userId: string, slug: string) {
    const profile = await ProfileModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!profile) throw new NotFoundException("Profile not found");
    return profile.assessmentBadges.find((badge) => badge.taxonomySlug === slug) ?? null;
  }

  async reviewQueue(businessUnits?: BusinessUnit[]) {
    const taxonomy = await SkillTaxonomyModel.find(
      businessUnits ? { businessUnit: { $in: businessUnits } } : {},
      { slug: 1 },
    ).lean();
    const attempts = await TestAttemptModel.find({
      status: AttemptStatus.UNDER_REVIEW,
      taxonomySlug: { $in: taxonomy.map((row) => row.slug) },
    }).sort({ startedAt: -1 }).limit(50).lean();
    return attempts.map((attempt) => ({
      id: attempt._id.toString(),
      userId: attempt.userId.toString(),
      taxonomySlug: attempt.taxonomySlug,
      startedAt: attempt.startedAt.toISOString(),
      scorePercent: attempt.scorePercent,
      violationCount: attempt.violations.length,
    }));
  }
}
