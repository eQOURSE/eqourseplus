import { SentryModule, SentryGlobalFilter } from "@sentry/nestjs/setup";
import {
  MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";

import { AuthModule } from "./auth/auth.module";
import { ClientsModule } from "./clients/clients.module";
import { CompanyReviewsModule } from "./company-reviews/company-reviews.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { RequestIdMiddleware } from "./observability/request-id.middleware";
import { SkillTaxonomyModule } from "./skill-taxonomy/skill-taxonomy.module";
import { VendorsModule } from "./vendors/vendors.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ClientsModule,
    CompanyReviewsModule,
    VendorsModule,
    SkillTaxonomyModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
