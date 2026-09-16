import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import {
  clientDraftSchema,
  clientUploadRequestSchema,
  type ClientDraftInput,
  type ClientUploadRequest,
} from "@eqourse/shared";

import type { AuthenticatedRequest } from "../auth/auth.types";
import { ZodBodyPipe } from "../auth/zod-body.pipe";
import { ClientService } from "./client.service";

@Controller("api/v1/clients")
export class ClientController {
  constructor(@Inject(ClientService) private readonly clients: ClientService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(clientDraftSchema)) body: ClientDraftInput,
  ) {
    return this.clients.createDraft(this.ownerId(request), body);
  }

  @Get("me")
  read(@Req() request: AuthenticatedRequest) {
    return this.clients.readOwn(this.ownerId(request));
  }

  @Patch("me")
  @HttpCode(200)
  save(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(clientDraftSchema)) body: ClientDraftInput,
  ) {
    return this.clients.save(this.ownerId(request), body);
  }

  @Post("me/submit")
  submit(@Req() request: AuthenticatedRequest) {
    return this.clients.submit(this.ownerId(request));
  }

  @Post("me/documents/upload-url")
  @Header("Cache-Control", "no-store")
  createDocumentUpload(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(clientUploadRequestSchema)) body: ClientUploadRequest,
  ) {
    return this.clients.createDocumentUpload(this.ownerId(request), body);
  }

  @Post("me/authorised-person/government-identity-document/upload-url")
  @Header("Cache-Control", "no-store")
  createIdentityDocumentUpload(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodBodyPipe(clientUploadRequestSchema)) body: ClientUploadRequest,
  ) {
    return this.clients.createIdentityDocumentUpload(this.ownerId(request), body);
  }

  private ownerId(request: AuthenticatedRequest): string {
    const ownerId = request.authUser?.id;
    if (!ownerId) throw new Error("Authenticated user is required");
    return ownerId;
  }
}
