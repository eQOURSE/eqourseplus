import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
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
import type { StoredUser } from "./auth.store";
import type { AuthenticatedRequest, TokenPair } from "./auth.types";
import { OtpIdentifierRateLimitGuard } from "./otp-identifier-rate-limit.guard";
import { Public } from "./public.decorator";
import { ZodBodyPipe } from "./zod-body.pipe";

@Controller("api/v1/auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post("otp/request")
  @UseGuards(ThrottlerGuard)
  @HttpCode(202)
  async requestOtp(
    @Body(new ZodBodyPipe(otpRequestSchema)) body: OtpRequest,
  ): Promise<{ status: "accepted" }> {
    await this.authService.requestOtp(body.email);
    return { status: "accepted" };
  }

  @Public()
  @Post("otp/verify")
  @UseGuards(ThrottlerGuard, OtpIdentifierRateLimitGuard)
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  verifyOtp(
    @Body(new ZodBodyPipe(otpVerifySchema)) body: OtpVerifyRequest,
  ): Promise<TokenPair> {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Public()
  @Post("refresh")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  refresh(
    @Body(new ZodBodyPipe(refreshTokenSchema)) body: RefreshTokenRequest,
  ): Promise<TokenPair> {
    return this.authService.refresh(body.refreshToken);
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  logout(
    @Body(new ZodBodyPipe(refreshTokenSchema)) body: RefreshTokenRequest,
  ): Promise<void> {
    return this.authService.logout(body.refreshToken);
  }

  @Get("session")
  @Header("Cache-Control", "no-store")
  session(@Req() request: AuthenticatedRequest): {
    userId: string;
    email: string;
    roleAssignments: StoredUser["roleAssignments"];
    profileState: StoredUser["profileState"];
  } {
    const user = request.authUser;
    if (!user) {
      throw new UnauthorizedException("Invalid or expired access token");
    }
    return {
      userId: user.id,
      email: user.email,
      roleAssignments: user.roleAssignments,
      profileState: user.profileState,
    };
  }
}
