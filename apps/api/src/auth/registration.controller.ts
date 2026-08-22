import {
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import {
  registrationRequestSchema,
  registrationVerifySchema,
  type RegistrationRequest,
  type RegistrationVerifyRequest,
} from "@eqourse/shared";

import { DeviceFingerprintService } from "./device-fingerprint.service";
import { OtpIdentifierRateLimitGuard } from "./otp-identifier-rate-limit.guard";
import { PhoneOtpIdentifierRateLimitGuard } from "./phone-otp-identifier-rate-limit.guard";
import { Public } from "./public.decorator";
import { RegistrationService } from "./registration.service";
import type { TokenPair } from "./auth.types";
import { ZodBodyPipe } from "./zod-body.pipe";

interface FingerprintRequest {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

@Public()
@Controller("api/v1/auth/register")
export class RegistrationController {
  constructor(
    @Inject(RegistrationService)
    private readonly registration: RegistrationService,
    @Inject(DeviceFingerprintService)
    private readonly fingerprints: DeviceFingerprintService,
  ) {}

  @Post("request")
  @UseGuards(ThrottlerGuard)
  @HttpCode(202)
  async requestRegistration(
    @Body(new ZodBodyPipe(registrationRequestSchema)) body: RegistrationRequest,
    @Req() request: FingerprintRequest,
  ): Promise<{ status: "accepted" }> {
    const fingerprintHash = this.fingerprints.hash({
      ip: request.ip ?? request.socket?.remoteAddress ?? "",
      userAgent: this.header(request, "user-agent"),
      acceptLanguage: this.header(request, "accept-language"),
    });
    await this.registration.requestRegistration(body, fingerprintHash);
    return { status: "accepted" };
  }

  @Post("verify")
  @UseGuards(
    ThrottlerGuard,
    OtpIdentifierRateLimitGuard,
    PhoneOtpIdentifierRateLimitGuard,
  )
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  verifyRegistration(
    @Body(new ZodBodyPipe(registrationVerifySchema))
    body: RegistrationVerifyRequest,
  ): Promise<TokenPair> {
    return this.registration.verifyRegistration(
      body.email,
      body.phone,
      body.emailOtp,
      body.phoneOtp,
    );
  }

  private header(request: FingerprintRequest, name: string): string {
    const value = request.headers[name];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }
}
