import { Body, Controller, Get, Header, HttpCode, Inject, Patch, Req } from "@nestjs/common";
import { profileDraftSchema, type ProfileDraftInput } from "@eqourse/shared";

import type { AuthenticatedRequest } from "../auth/auth.types";
import { ZodBodyPipe } from "../auth/zod-body.pipe";
import { ProfileService } from "./profile.service";

@Controller("api/v1/profiles")
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profiles: ProfileService) {}

  @Get("me")
  @Header("Cache-Control", "no-store")
  read(@Req() request: AuthenticatedRequest) {
    return this.profiles.readOwn(this.userId(request));
  }

  @Patch("me")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  save(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(profileDraftSchema)) body: ProfileDraftInput,
  ) {
    return this.profiles.save(this.userId(request), body);
  }

  private userId(request: AuthenticatedRequest): string {
    const userId = request.authUser?.id;
    if (!userId) throw new Error("Authenticated user is required");
    return userId;
  }
}
