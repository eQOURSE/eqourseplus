import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import {
  AUTH_CLOCK,
  AUTH_CONFIG,
  AUTH_STORE,
  MAILER_ADAPTER,
  REGISTRATION_STORE,
} from "./auth.constants";
import { loadAuthConfig } from "./auth.config";
import { AuthController } from "./auth.controller";
import { InMemoryAuthRateLimitStore } from "./auth-rate-limit.store";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtTokenService } from "./jwt-token.service";
import { MongooseAuthStore } from "./mongoose-auth.store";
import { MongooseRegistrationStore } from "./mongoose-registration.store";
import { OtpIdentifierRateLimitGuard } from "./otp-identifier-rate-limit.guard";
import { RegistrationController } from "./registration.controller";
import { RegistrationService } from "./registration.service";
import { DeviceFingerprintService } from "./device-fingerprint.service";
import { RolesGuard } from "./roles.guard";
import { createMailerAdapter } from "./resend-mailer.adapter";

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController, RegistrationController],
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: () => loadAuthConfig(process.env),
    },
    {
      provide: AUTH_CLOCK,
      useValue: { now: (): Date => new Date() },
    },
    MongooseAuthStore,
    {
      provide: AUTH_STORE,
      useExisting: MongooseAuthStore,
    },
    {
      provide: MAILER_ADAPTER,
      useFactory: () => createMailerAdapter(process.env),
    },
    MongooseRegistrationStore,
    {
      provide: REGISTRATION_STORE,
      useExisting: MongooseRegistrationStore,
    },
    InMemoryAuthRateLimitStore,
    OtpIdentifierRateLimitGuard,
    DeviceFingerprintService,
    JwtTokenService,
    AuthService,
    RegistrationService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
