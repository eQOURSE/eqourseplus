import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";

import { AUTH_CLOCK, AUTH_CONFIG } from "./auth.constants";
import type { AuthConfig } from "./auth.config";
import { InMemoryAuthRateLimitStore } from "./auth-rate-limit.store";
import type { AuthClock } from "./auth.types";

@Injectable()
export class OtpIdentifierRateLimitGuard implements CanActivate {
  constructor(
    @Inject(InMemoryAuthRateLimitStore)
    private readonly store: InMemoryAuthRateLimitStore,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ body?: { email?: unknown } }>();
    const body = request.body as { email?: unknown } | undefined;
    if (typeof body?.email !== "string") return true;
    const identifier = body.email.trim().toLowerCase();
    if (!identifier) return true;

    const permitted = this.store.consume(
      `otp-verify:${identifier}`,
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
