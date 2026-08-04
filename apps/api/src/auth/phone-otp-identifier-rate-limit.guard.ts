import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";

import type { AuthConfig } from "./auth.config";
import { AUTH_CLOCK, AUTH_CONFIG } from "./auth.constants";
import { InMemoryAuthRateLimitStore } from "./auth-rate-limit.store";
import type { AuthClock } from "./auth.types";

@Injectable()
export class PhoneOtpIdentifierRateLimitGuard implements CanActivate {
  constructor(
    @Inject(InMemoryAuthRateLimitStore)
    private readonly store: InMemoryAuthRateLimitStore,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ body?: { phone?: unknown } }>();
    if (typeof request.body?.phone !== "string") return true;
    const identifier = request.body.phone.trim();
    if (!identifier) return true;

    const permitted = this.store.consume(
      `phone-otp-verify:${identifier}`,
      this.clock.now(),
      this.config.authRateLimitMaxRequests,
      this.config.authRateLimitWindowMilliseconds,
    );
    if (!permitted) {
      throw new ThrottlerException("Too many OTP verification attempts");
    }
    return true;
  }
}
