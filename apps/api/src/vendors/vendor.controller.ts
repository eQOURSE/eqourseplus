import { Body, Controller, Get, HttpCode, Inject, Patch, Post, Req } from "@nestjs/common";

import type { AuthenticatedRequest } from "../auth/auth.types";
import { ZodBodyPipe } from "../auth/zod-body.pipe";
import { vendorDraftSchema, type VendorDraftInput } from "@eqourse/shared";
import { VendorService } from "./vendor.service";

@Controller("api/v1/vendors")
export class VendorController {
  constructor(@Inject(VendorService) private readonly vendors: VendorService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(vendorDraftSchema)) body: VendorDraftInput,
  ) {
    return this.vendors.createDraft(this.ownerId(request), body);
  }

  @Get("me")
  read(@Req() request: AuthenticatedRequest) {
    return this.vendors.readOwn(this.ownerId(request));
  }

  @Patch("me")
  @HttpCode(200)
  save(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(vendorDraftSchema)) body: VendorDraftInput,
  ) {
    return this.vendors.save(this.ownerId(request), body);
  }

  @Post("me/submit")
  submit(@Req() request: AuthenticatedRequest) {
    return this.vendors.submit(this.ownerId(request));
  }

  private ownerId(request: AuthenticatedRequest): string {
    const ownerId = request.authUser?.id;
    if (!ownerId) throw new Error("Authenticated user is required");
    return ownerId;
  }
}
