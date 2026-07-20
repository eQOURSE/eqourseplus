import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
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
import type { AuthStore, StoredUser } from "./auth.store";
import type { AuthClock, TokenPair } from "./auth.types";
import { JwtTokenService } from "./jwt-token.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_STORE) private readonly store: AuthStore,
    @Inject(MAILER_ADAPTER) private readonly mailer: MailerAdapter,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
    @Inject(JwtTokenService) private readonly tokens: JwtTokenService,
  ) {}

  async requestOtp(email: string): Promise<void> {
    const user = await this.store.findByEmail(email);
    if (!user) return;

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
    let userId: string;
    try {
      userId = this.tokens.verifyRefresh(refreshToken, now).sub;
    } catch {
      throw this.invalidCredentials();
    }

    const user = await this.store.findById(userId);
    if (!user) throw this.invalidCredentials();

    const replacement = this.tokens.issuePair(user.id, now);
    const rotated = await this.store.rotateRefreshSession(
      user.id,
      this.tokens.digest(refreshToken),
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
    let userId: string;
    try {
      userId = this.tokens.verifyRefresh(refreshToken, now).sub;
    } catch {
      throw this.invalidCredentials();
    }
    const revoked = await this.store.revokeRefreshSession(
      userId,
      this.tokens.digest(refreshToken),
      now,
    );
    if (!revoked) throw this.invalidCredentials();
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
