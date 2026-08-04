import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { MailerAdapter, SmsAdapter } from "@eqourse/adapters";
import { ProfileState, type RegistrationRequest } from "@eqourse/shared";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import type { AuthConfig } from "./auth.config";
import {
  AUTH_CLOCK,
  AUTH_CONFIG,
  MAILER_ADAPTER,
  OTP_MAX_WRONG_ATTEMPTS,
  REGISTRATION_STORE,
  SMS_ADAPTER,
} from "./auth.constants";
import type { OtpChallenge } from "./auth.store";
import type { AuthClock, TokenPair } from "./auth.types";
import { JwtTokenService } from "./jwt-token.service";
import type {
  RegistrationConflictField,
  RegistrationStore,
  RegistrationValues,
} from "./registration.store";

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @Inject(REGISTRATION_STORE) private readonly store: RegistrationStore,
    @Inject(MAILER_ADAPTER) private readonly mailer: MailerAdapter,
    @Inject(SMS_ADAPTER) private readonly sms: SmsAdapter,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
    @Inject(JwtTokenService) private readonly tokens: JwtTokenService,
  ) {}

  async requestRegistration(
    request: RegistrationRequest,
    fingerprintHash: string,
  ): Promise<void> {
    const now = this.clock.now();
    const emailCode = this.createCode();
    const phoneCode = this.createCode();
    const expiresAt = new Date(now.getTime() + this.config.otpTtlMilliseconds);
    const values: RegistrationValues = {
      email: request.email,
      phone: request.phone,
      countryCode: request.countryCode,
      ...(request.pan ? { pan: request.pan } : {}),
      profileState: ProfileState.DRAFT,
      emailChallenge: this.challenge("email", request.email, emailCode, expiresAt),
      phoneChallenge: this.challenge("phone", request.phone, phoneCode, expiresAt),
      deviceFingerprint: {
        hash: fingerprintHash,
        firstSeenAt: now,
        lastSeenAt: now,
      },
    };

    const duplicateDevice = await this.store.deviceFingerprintExists(
      fingerprintHash,
    );
    let result = await this.store.createRegistration(values, duplicateDevice);

    if (result.status === "CONFLICT") {
      const originalField = result.field;
      const reclaimable = await this.store.findReclaimableRegistration(
        values,
        now,
      );
      if (reclaimable) {
        const duplicateOutsideReclaimedAccount =
          await this.store.deviceFingerprintExists(
            fingerprintHash,
            reclaimable.id,
          );
        result = await this.store.reclaimRegistration(
          reclaimable.id,
          values,
          duplicateOutsideReclaimedAccount,
          now,
        );
        if (result.status === "WRITTEN") {
          this.logger.warn({
            event: "expired_registration_reclaimed",
            collisionField: originalField,
          });
        }
      }
    }

    if (result.status === "CONFLICT") {
      this.logConflict(result.field);
      throw this.registrationConflict();
    }

    await this.mailer.sendOtp({
      to: request.email,
      code: emailCode,
      expiresAt,
    });
    await this.sms.sendOtp({
      to: request.phone,
      code: phoneCode,
      expiresAt,
    });
  }

  async verifyRegistration(
    email: string,
    phone: string,
    emailCode: string,
    phoneCode: string,
  ): Promise<TokenPair> {
    const now = this.clock.now();
    const pending = await this.store.findPendingRegistration(email, phone);
    if (!pending) throw this.invalidCredentials();

    const emailDigest = this.digestOtp("email", email, emailCode);
    const phoneDigest = this.digestOtp("phone", phone, phoneCode);
    const emailValid = this.challengeMatches(
      pending.emailChallenge,
      emailDigest,
      now,
    );
    const phoneValid = this.challengeMatches(
      pending.phoneChallenge,
      phoneDigest,
      now,
    );
    if (!emailValid || !phoneValid) {
      await this.store.recordFailedVerification(
        pending.id,
        !emailValid,
        !phoneValid,
        now,
        OTP_MAX_WRONG_ATTEMPTS,
      );
      throw this.invalidCredentials();
    }

    const issued = this.tokens.issuePair(pending.id, now);
    const completed = await this.store.completeRegistration(
      pending.id,
      emailDigest,
      phoneDigest,
      issued.refreshSession,
      now,
    );
    if (!completed) throw this.invalidCredentials();
    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
    };
  }

  private challenge(
    kind: "email" | "phone",
    identifier: string,
    code: string,
    expiresAt: Date,
  ): OtpChallenge {
    return {
      digest: this.digestOtp(kind, identifier, code),
      expiresAt,
      wrongAttempts: 0,
    };
  }

  private challengeMatches(
    challenge: OtpChallenge | undefined,
    digest: string,
    now: Date,
  ): boolean {
    if (!challenge || challenge.expiresAt <= now) return false;
    const expected = Buffer.from(challenge.digest, "hex");
    const actual = Buffer.from(digest, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private digestOtp(
    kind: "email" | "phone",
    identifier: string,
    code: string,
  ): string {
    return createHmac("sha256", this.config.jwtSecret)
      .update(`eqourse-plus:registration-${kind}-otp:`)
      .update(identifier)
      .update(":")
      .update(code)
      .digest("hex");
  }

  private createCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  private logConflict(field: RegistrationConflictField): void {
    this.logger.warn({
      event: "registration_conflict",
      collisionField: field,
    });
  }

  private registrationConflict(): ConflictException {
    return new ConflictException({
      statusCode: 409,
      error: "Conflict",
      code: "REGISTRATION_CONFLICT",
      message: "Registration could not be started",
    });
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException("Invalid or expired credentials");
  }
}
