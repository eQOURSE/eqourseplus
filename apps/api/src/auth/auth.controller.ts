import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import {
  otpRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  type OtpRequest,
  type OtpVerifyRequest,
  type RefreshTokenRequest,
} from "@eqourse/shared";

import { AuthService } from "./auth.service";
import type { TokenPair } from "./auth.types";
import { OtpIdentifierRateLimitGuard } from "./otp-identifier-rate-limit.guard";
import { Public } from "./public.decorator";
import { ZodBodyPipe } from "./zod-body.pipe";

@Public()
@UseGuards(ThrottlerGuard)
@Controller("api/v1/auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("otp/request")
  @HttpCode(202)
  async requestOtp(
    @Body(new ZodBodyPipe(otpRequestSchema)) body: OtpRequest,
  ): Promise<{ status: "accepted" }> {
    await this.authService.requestOtp(body.email);
    return { status: "accepted" };
  }

  @Post("otp/verify")
  @UseGuards(OtpIdentifierRateLimitGuard)
  @HttpCode(200)
  verifyOtp(
    @Body(new ZodBodyPipe(otpVerifySchema)) body: OtpVerifyRequest,
  ): Promise<TokenPair> {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(
    @Body(new ZodBodyPipe(refreshTokenSchema)) body: RefreshTokenRequest,
  ): Promise<TokenPair> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post("logout")
  @HttpCode(204)
  logout(
    @Body(new ZodBodyPipe(refreshTokenSchema)) body: RefreshTokenRequest,
  ): Promise<void> {
    return this.authService.logout(body.refreshToken);
  }
}
