import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Header, HttpCode,
  Inject, Param, Post, Put, Req,
} from "@nestjs/common";
import {
  type BusinessUnit, ProfileState, Role, testAnswersSchema, testConfigSchema,
  testQuestionSchema, testViolationSchema, type TestAnswersInput,
  type TestConfigInput, type TestQuestionInput, type TestViolationInput,
} from "@eqourse/shared";

import type { AuthenticatedRequest } from "../auth/auth.types";
import { ZodBodyPipe } from "../auth/zod-body.pipe";
import { SkillTaxonomyModel } from "../database/skill-taxonomy.schema";
import { ProfileModel } from "../profiles/profile.schema";
import { AssessmentService } from "./assessment.service";

function objectId(value: string): string {
  if (!/^[a-f\d]{24}$/i.test(value)) throw new BadRequestException("Invalid attempt ID");
  return value;
}

@Controller("api/v1/tests")
export class AssessmentController {
  constructor(@Inject(AssessmentService) private readonly assessments: AssessmentService) {}

  private admin(request: AuthenticatedRequest): void {
    if (!request.authUser?.roleAssignments.some((assignment) => assignment.role === Role.SUPER_ADMIN)) {
      throw new ForbiddenException("Super admin required");
    }
  }

  private async candidate(request: AuthenticatedRequest): Promise<string> {
    const user = request.authUser;
    if (!user || (user.roleAssignments.length > 0 &&
      !user.roleAssignments.some((assignment) => assignment.role === Role.FREELANCER))) {
      throw new ForbiddenException("Submitted freelancer profile required");
    }
    const profile = await ProfileModel.findOne({ userId: user.id }).lean();
    if (!profile || ![ProfileState.SUBMITTED, ProfileState.UNDER_REVIEW, ProfileState.TEST_PENDING].includes(profile.state)) {
      throw new ForbiddenException("Submitted freelancer profile required");
    }
    return user.id;
  }

  private async verifier(request: AuthenticatedRequest, slug: string): Promise<void> {
    if (request.authUser?.roleAssignments.some((assignment) => assignment.role === Role.SUPER_ADMIN)) return;
    const taxonomy = await SkillTaxonomyModel.findOne({ slug }).lean();
    if (!taxonomy || !request.authUser?.roleAssignments.some((assignment) =>
      assignment.role === Role.VERIFIER && assignment.businessUnit === taxonomy.businessUnit)) {
      throw new ForbiddenException("Verifier role required");
    }
  }

  @Put("config")
  async configure(@Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(testConfigSchema)) body: TestConfigInput): Promise<{ status: "configured" }> {
    this.admin(request);
    await this.assessments.configure(body);
    return { status: "configured" };
  }

  @Post(":slug/questions")
  async addQuestion(@Req() request: AuthenticatedRequest, @Param("slug") slug: string,
    @Body(new ZodBodyPipe(testQuestionSchema)) body: TestQuestionInput): Promise<{ status: "draft" }> {
    this.admin(request);
    await this.assessments.addQuestion(slug, body);
    return { status: "draft" };
  }

  @Get(":slug/questions")
  @Header("Cache-Control", "no-store")
  questionsForReview(@Req() request: AuthenticatedRequest, @Param("slug") slug: string) {
    this.admin(request);
    return this.assessments.questionsForReview(slug);
  }

  @Post(":slug/questions/:questionId/approve")
  async approveQuestion(@Req() request: AuthenticatedRequest, @Param("slug") slug: string,
    @Param("questionId") questionId: string): Promise<{ status: "approved" }> {
    this.admin(request);
    await this.assessments.approveQuestion(slug, questionId);
    return { status: "approved" };
  }

  @Get(":slug/eligibility")
  @Header("Cache-Control", "no-store")
  async eligibility(@Req() request: AuthenticatedRequest, @Param("slug") slug: string) {
    return this.assessments.eligibility(await this.candidate(request), slug);
  }

  @Get("catalog")
  @Header("Cache-Control", "no-store")
  async catalog(@Req() request: AuthenticatedRequest) {
    return this.assessments.catalog(await this.candidate(request));
  }

  @Get("attempts/:attemptId")
  @Header("Cache-Control", "no-store")
  async attempt(@Req() request: AuthenticatedRequest, @Param("attemptId") attemptId: string) {
    return this.assessments.getAttempt(await this.candidate(request), objectId(attemptId));
  }

  @Post(":slug/attempts")
  @Header("Cache-Control", "no-store")
  async start(@Req() request: AuthenticatedRequest, @Param("slug") slug: string) {
    return this.assessments.start(await this.candidate(request), slug);
  }

  @Post("attempts/:attemptId/violations")
  @HttpCode(204)
  async recordViolation(@Req() request: AuthenticatedRequest, @Param("attemptId") attemptId: string,
    @Body(new ZodBodyPipe(testViolationSchema)) body: TestViolationInput) {
    return this.assessments.recordViolation(await this.candidate(request), objectId(attemptId), body.kind);
  }

  @Post("attempts/:attemptId/submit")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  async submit(@Req() request: AuthenticatedRequest, @Param("attemptId") attemptId: string,
    @Body(new ZodBodyPipe(testAnswersSchema)) body: TestAnswersInput) {
    return this.assessments.submit(await this.candidate(request), objectId(attemptId), body.answers);
  }

  @Get("attempts/:attemptId/report")
  @Header("Cache-Control", "no-store")
  async report(@Req() request: AuthenticatedRequest, @Param("attemptId") attemptId: string) {
    const report = await this.assessments.report(objectId(attemptId));
    await this.verifier(request, report.taxonomySlug);
    return report;
  }

  @Get("review-queue")
  @Header("Cache-Control", "no-store")
  reviewQueue(@Req() request: AuthenticatedRequest) {
    const user = request.authUser;
    if (!user) throw new ForbiddenException("Verifier role required");
    if (user.roleAssignments.some((assignment) => assignment.role === Role.SUPER_ADMIN)) {
      return this.assessments.reviewQueue();
    }
    const units = user.roleAssignments.filter((assignment) => assignment.role === Role.VERIFIER)
      .map((assignment) => assignment.businessUnit) as BusinessUnit[];
    if (!units.length) throw new ForbiddenException("Verifier role required");
    return this.assessments.reviewQueue(units);
  }

  @Get("profiles/:userId/badges/:slug")
  @Header("Cache-Control", "no-store")
  async badge(@Req() request: AuthenticatedRequest, @Param("userId") userId: string,
    @Param("slug") slug: string) {
    await this.verifier(request, slug);
    return this.assessments.badge(objectId(userId), slug);
  }
}
