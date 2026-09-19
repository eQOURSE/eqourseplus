import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import {
  Role,
  companyReviewDecisionSchema,
  type CompanyReviewDecisionInput,
} from "@eqourse/shared";

import type { AuthenticatedRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { ZodBodyPipe } from "../auth/zod-body.pipe";
import { CompanyReviewService } from "./company-review.service";

@Controller("api/v1/company-reviews")
@Roles(Role.VERIFIER)
export class CompanyReviewController {
  constructor(
    @Inject(CompanyReviewService)
    private readonly reviews: CompanyReviewService,
  ) {}

  @Get()
  queue() {
    return this.reviews.queue();
  }

  @Get(":type/:id")
  detail(
    @Param("type") type: string,
    @Param("id") id: string,
  ) {
    return this.reviews.detail(this.companyType(type), id);
  }

  @Get(":type/:id/documents/:kind/url")
  @Header("Cache-Control", "no-store")
  documentUrl(
    @Param("type") type: string,
    @Param("id") id: string,
    @Param("kind") kind: string,
  ) {
    return this.reviews.documentUrl(this.companyType(type), id, kind);
  }

  @Post(":type/:id/decisions")
  decide(
    @Param("type") type: string,
    @Param("id") id: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(companyReviewDecisionSchema))
    input: CompanyReviewDecisionInput,
  ) {
    const actorUserId = request.authUser?.id;
    if (!actorUserId) throw new Error("Authenticated user is required");
    return this.reviews.decide(
      this.companyType(type),
      id,
      actorUserId,
      input,
    );
  }

  private companyType(value: string): "vendors" | "clients" {
    if (value !== "vendors" && value !== "clients") {
      throw new BadRequestException("Company type must be vendors or clients");
    }
    return value;
  }
}
