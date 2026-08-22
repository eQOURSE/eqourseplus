import {
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { MailerAdapter } from "@eqourse/adapters";
import { createHmac, randomInt } from "node:crypto";

import {
  AUTH_CLOCK,
  AUTH_CONFIG,
  AUTH_STORE,
  MAILER_ADAPTER,
  OTP_MAX_WRONG_ATTEMPTS,
} from "./auth.constants";
import type { AuthConfig } from "./auth.config";
import { InMemoryAuthRateLimitStore } from "./auth-rate-limit.store";
import type { AuthStore, StoredUser } from "./auth.store";
import type { AuthClock, TokenPair } from "./auth.types";
import { JwtTokenService } from "./jwt-token.service";
import { activeRefreshSessionPredicate } from "./refresh-session";

type SessionRateLimitOperation = "refresh" | "logout";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_STORE) private readonly store: AuthStore,
    @Inject(MAILER_ADAPTER) private readonly mailer: MailerAdapter,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
    @Inject(JwtTokenService) private readonly tokens: JwtTokenService,
    @Inject(InMemoryAuthRateLimitStore)
    private readonly rateLimits: InMemoryAuthRateLimitStore,
  ) {}

  async requestOtp(email: string): Promise<void> {
    const user = await this.store.findByEmail(email);
    if (!user) return;
    if (user.phone && !user.phoneVerifiedAt) return;

    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + this.config.otpTtlMilliseconds);
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.store.setOtpChallenge(user.id, {
      digest: this.digestOtp(user.id, code),
      expiresAt,
      wrongAttempts: 0,
    });
    await this.mailer.sendOtp({ to: user.email, code, expiresAt });
  }

  async verifyOtp(email: string, code: string): Promise<TokenPair> {
    const user = await this.store.findByEmail(email);
    if (!user) throw this.invalidCredentials();
    if (user.phone && !user.phoneVerifiedAt) throw this.invalidCredentials();

    const result = await this.store.verifyOtp(
      user.id,
      this.digestOtp(user.id, code),
      this.clock.now(),
      OTP_MAX_WRONG_ATTEMPTS,
    );
    if (result !== "VALID") throw this.invalidCredentials();
    return this.issueInitialTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const now = this.clock.now();
    const { digest, user } = await this.classifyRefreshSession(
      "refresh",
      refreshToken,
      now,
    );

    const replacement = this.tokens.issuePair(user.id, now);
    const rotated = await this.store.rotateRefreshSession(
      user.id,
      digest,
      replacement.refreshSession,
      now,
    );
    if (!rotated) throw this.invalidCredentials();
    return {
      accessToken: replacement.accessToken,
      refreshToken: replacement.refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const now = this.clock.now();
    const { digest, user } = await this.classifyRefreshSession(
      "logout",
      refreshToken,
      now,
    );
    const revoked = await this.store.revokeRefreshSession(
      user.id,
      digest,
      now,
    );
    if (!revoked) throw this.invalidCredentials();
  }

  private async classifyRefreshSession(
    operation: SessionRateLimitOperation,
    refreshToken: string,
    now: Date,
  ): Promise<{ digest: string; user: StoredUser }> {
    let subject: string;
    try {
      subject = this.tokens.verifyRefresh(refreshToken, now).sub;
    } catch {
      this.consumeRateLimit(`auth-${operation}:invalid`, now);
      throw this.invalidCredentials();
    }

    const digest = this.tokens.digest(refreshToken);
    const user = await this.store.findById(subject);
    const active =
      user?.refreshSessions.some(
        (session) =>
          session.digest === digest &&
          activeRefreshSessionPredicate.test(session, now),
      ) ?? false;
    this.consumeRateLimit(
      `auth-${operation}:${active ? "active" : "inactive"}:${subject}`,
      now,
    );
    if (!user || !active) throw this.invalidCredentials();
    return { digest, user };
  }

  private consumeRateLimit(key: string, now: Date): void {
    const permitted = this.rateLimits.consume(
      key,
      now,
      this.config.authRateLimitMaxRequests,
      this.config.authRateLimitWindowMilliseconds,
    );
    if (!permitted) {
      throw new ThrottlerException("Too many session requests");
    }
  }

  private async issueInitialTokens(user: StoredUser): Promise<TokenPair> {
    const issued = this.tokens.issuePair(user.id, this.clock.now());
    await this.store.addRefreshSession(user.id, issued.refreshSession);
    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
    };
  }

  private digestOtp(userId: string, code: string): string {
    return createHmac("sha256", this.config.jwtSecret)
      .update("eqourse-plus:otp:")
      .update(userId)
      .update(":")
      .update(code)
      .digest("hex");
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException("Invalid or expired credentials");
  }
}
