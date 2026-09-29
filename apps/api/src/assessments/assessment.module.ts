import { Module } from "@nestjs/common";
import { LiteProctoringAdapter } from "@eqourse/adapters";

import { AssessmentController } from "./assessment.controller";
import { AssessmentService } from "./assessment.service";

@Module({ controllers: [AssessmentController], providers: [
  { provide: "PROCTORING_ADAPTER", useClass: LiteProctoringAdapter },
  AssessmentService,
], exports: [AssessmentService] })
export class AssessmentModule {}
