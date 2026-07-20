import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { SandboxMailerAdapter } from "@eqourse/adapters";

import {
  AUTH_CLOCK,
  AUTH_CONFIG,
  AUTH_STORE,
  MAILER_ADAPTER,
} from "./auth.constants";
import { loadAuthConfig } from "./auth.config";
import { AuthController } from "./auth.controller";
import { InMemoryAuthRateLimitStore } from "./auth-rate-limit.store";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtTokenService } from "./jwt-token.service";
import { MongooseAuthStore } from "./mongoose-auth.store";
import { OtpIdentifierRateLimitGuard } from "./otp-identifier-rate-limit.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
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
      useFactory: (): SandboxMailerAdapter => new SandboxMailerAdapter(),
    },
    InMemoryAuthRateLimitStore,
    OtpIdentifierRateLimitGuard,
    JwtTokenService,
    AuthService,
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
