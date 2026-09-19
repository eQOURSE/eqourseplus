import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { clientSchema } from "../clients/client.schema";
import { CLIENT_MODEL_NAME } from "../clients/client.constants";
import { createStorageAdapter } from "../company-registration/r2-storage.adapter";
import { vendorSchema } from "../vendors/vendor.schema";
import { VENDOR_MODEL_NAME } from "../vendors/vendor.constants";
import {
  auditLogSchema,
} from "./audit-log.schema";
import {
  MongooseAuditLogStore,
} from "./audit-log.store";
import {
  AUDIT_LOG_MODEL_NAME,
  AUDIT_LOG_STORE,
  COMPANY_REVIEW_STORAGE_ADAPTER,
} from "./company-review.constants";
import { CompanyReviewController } from "./company-review.controller";
import { CompanyReviewService } from "./company-review.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VENDOR_MODEL_NAME, schema: vendorSchema },
      { name: CLIENT_MODEL_NAME, schema: clientSchema },
      { name: AUDIT_LOG_MODEL_NAME, schema: auditLogSchema },
    ]),
  ],
  controllers: [CompanyReviewController],
  providers: [
    CompanyReviewService,
    MongooseAuditLogStore,
    {
      provide: AUDIT_LOG_STORE,
      useExisting: MongooseAuditLogStore,
    },
    {
      provide: COMPANY_REVIEW_STORAGE_ADAPTER,
      useFactory: () => createStorageAdapter(process.env),
    },
  ],
  exports: [AUDIT_LOG_STORE, COMPANY_REVIEW_STORAGE_ADAPTER],
})
export class CompanyReviewsModule {}
