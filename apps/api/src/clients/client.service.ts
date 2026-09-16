import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { StorageAdapter } from "@eqourse/adapters";
import {
  ClientState,
  canTransitionClient,
  getCompanyCountryRequirements,
  type ClientDraftInput,
  type ClientUploadRequest,
  type ClientUploadResponse,
} from "@eqourse/shared";
import {
  assertDocumentKey,
  canonicalizeCompanyIdentifier,
  createCompanyUpload,
  missingCompanyRequirements,
} from "../company-registration/company-registration";

import { digestClientIdentifier } from "./client-identifier-digest";
import {
  CLIENT_IDENTIFIER_HMAC_SECRET,
  CLIENT_STORAGE_ADAPTER,
  CLIENT_STORE,
} from "./client.constants";
import type { ClientDocument } from "./client.schema";
import type { ClientStore } from "./client.store";

@Injectable()
export class ClientService {
  constructor(
    @Inject(CLIENT_STORE) private readonly store: ClientStore,
    @Inject(CLIENT_IDENTIFIER_HMAC_SECRET) private readonly hmacSecret: string,
    @Inject(CLIENT_STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  async createDraft(ownerUserId: string, input: ClientDraftInput): Promise<ClientDocument> {
    const draft = await this.store.createDraft(ownerUserId);
    if (Object.keys(input).length === 0) return draft;
    return this.save(ownerUserId, input);
  }

  async readOwn(ownerUserId: string): Promise<ClientDocument> {
    const client = await this.store.findByOwner(ownerUserId);
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  async save(ownerUserId: string, input: ClientDraftInput): Promise<ClientDocument> {
    const current = await this.readOwn(ownerUserId);
    if (![ClientState.DRAFT, ClientState.MORE_INFO_NEEDED].includes(current.state)) {
      throw new BadRequestException("Client cannot be edited in its current state");
    }
    const patch = { ...input } as ClientDraftInput;
    if (input.documents) {
      for (const document of input.documents) {
        assertDocumentKey(
          document.objectKey,
          `clients/${current._id.toString()}/documents/${document.kind}/`,
          "client",
        );
        const requirements = getCompanyCountryRequirements(
          (input.countryCode ?? current.countryCode) ?? "",
        );
        if (!requirements?.documentKinds.includes(document.kind)) {
          throw new BadRequestException("Document kind is not applicable to this country");
        }
      }
    }
    if (input.authorisedPerson) {
      const document = input.authorisedPerson.governmentIdentityDocument;
      if (document) {
        if (document.kind === "AADHAAR" || document.kind === "RAW_AADHAAR") {
          throw new BadRequestException("Raw Aadhaar document kind is not accepted");
        }
        assertDocumentKey(
          document.objectKey,
          `clients/${current._id.toString()}/authorised-person/government-identity-document/${document.kind}/`,
          "client",
        );
      }
    }
    if (input.countryIdentifiers) {
      const countryCode = (input.countryCode ?? current.countryCode)?.toUpperCase();
      if (!countryCode) throw new BadRequestException("Country is required for identifiers");
      patch.countryIdentifiers = input.countryIdentifiers.map((identifier) => ({
        scheme: identifier.scheme.trim().toUpperCase(),
        value: canonicalizeCompanyIdentifier(countryCode, identifier.scheme, identifier.value, "client"),
        lookupDigest: digestClientIdentifier(
          countryCode,
          identifier.scheme,
          identifier.value,
          this.hmacSecret,
        ),
      }));
    }
    return this.store.updateDraft(ownerUserId, patch);
  }

  async submit(ownerUserId: string): Promise<ClientDocument> {
    const client = await this.readOwn(ownerUserId);
    if (!canTransitionClient(client.state, ClientState.SUBMITTED)) {
      throw new BadRequestException("Client cannot be submitted in its current state");
    }
    this.assertComplete(client);
    const submitted = await this.store.markSubmitted(
      client._id,
      client.submittedAt ?? new Date(),
    );
    if (!submitted) {
      throw new BadRequestException("Client cannot be submitted in its current state");
    }
    return submitted;
  }

  async createDocumentUpload(
    ownerUserId: string,
    input: ClientUploadRequest,
  ): Promise<ClientUploadResponse> {
    const client = await this.editableClient(ownerUserId);
    const requirements = client.countryCode
      ? getCompanyCountryRequirements(client.countryCode)
      : undefined;
    if (!requirements?.documentKinds.includes(input.kind)) {
      throw new BadRequestException("Document kind is not applicable to this country");
    }
    return createCompanyUpload(
      this.storage,
      `clients/${client._id.toString()}/documents/${input.kind}/`,
      input,
    );
  }

  async createIdentityDocumentUpload(
    ownerUserId: string,
    input: ClientUploadRequest,
  ): Promise<ClientUploadResponse> {
    const client = await this.editableClient(ownerUserId);
    if (input.kind === "AADHAAR" || input.kind === "RAW_AADHAAR") {
      throw new BadRequestException("Raw Aadhaar document kind is not accepted");
    }
    return createCompanyUpload(
      this.storage,
      `clients/${client._id.toString()}/authorised-person/government-identity-document/${input.kind}/`,
      input,
    );
  }

  private async editableClient(ownerUserId: string): Promise<ClientDocument> {
    const client = await this.readOwn(ownerUserId);
    if (![ClientState.DRAFT, ClientState.MORE_INFO_NEEDED].includes(client.state)) {
      throw new BadRequestException("Client documents cannot be changed in its current state");
    }
    return client;
  }

  private assertComplete(client: ClientDocument): void {
    const missing: string[] = [];
    const requirements = client.countryCode
      ? getCompanyCountryRequirements(client.countryCode)
      : undefined;
    if (
      !client.legalName ||
      !client.countryCode ||
      !client.registeredAddress ||
      !client.website ||
      !client.contactPerson
    ) {
      missing.push("business_details");
    }
    if (!client.authorisedPerson?.name || !client.authorisedPerson.governmentIdentityDocument) {
      missing.push("authorised_person");
    }
    missing.push(
      ...missingCompanyRequirements(client.countryIdentifiers, client.documents, requirements),
    );
    if (missing.length > 0) {
      throw new BadRequestException({
        message: "Client is missing required submission information",
        missing,
      });
    }
  }
}
