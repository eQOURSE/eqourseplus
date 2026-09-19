import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { StorageAdapter } from "@eqourse/adapters";
import {
  ClientState,
  VendorState,
  canTransitionClient,
  canTransitionVendor,
  type CompanyReviewDecisionInput,
} from "@eqourse/shared";
import {
  Connection,
  Types,
  type ClientSession,
  type Model,
} from "mongoose";

import {
  CLIENT_MODEL_NAME,
} from "../clients/client.constants";
import type {
  ClientDocument,
  ClientRecord,
} from "../clients/client.schema";
import { VENDOR_MODEL_NAME } from "../vendors/vendor.constants";
import type {
  VendorDocument,
  VendorRecord,
} from "../vendors/vendor.schema";
import type { AuditLogStore } from "./audit-log.store";
import {
  AUDIT_LOG_STORE,
  COMPANY_DOCUMENT_GET_EXPIRY_SECONDS,
  COMPANY_REVIEW_STORAGE_ADAPTER,
} from "./company-review.constants";

type CompanyType = "vendors" | "clients";
type CompanyDocument = VendorDocument | ClientDocument;

export interface QueueItem {
  id: string;
  companyType: CompanyType;
  state: VendorState | ClientState;
  submittedAt: string;
}

@Injectable()
export class CompanyReviewService {
  constructor(
    @InjectModel(VENDOR_MODEL_NAME)
    private readonly vendors: Model<VendorRecord>,
    @InjectModel(CLIENT_MODEL_NAME)
    private readonly clients: Model<ClientRecord>,
    @Inject(AUDIT_LOG_STORE)
    private readonly auditLogs: AuditLogStore,
    @Inject(COMPANY_REVIEW_STORAGE_ADAPTER)
    private readonly storage: StorageAdapter,
    @InjectConnection()
    private readonly database: Connection,
  ) {}

  async queue(): Promise<QueueItem[]> {
    const [vendors, clients] = await Promise.all([
      this.vendors
        .find(
          {
            state: {
              $in: [VendorState.SUBMITTED, VendorState.UNDER_REVIEW],
            },
          },
          { _id: 1, state: 1, submittedAt: 1 },
        )
        .lean()
        .exec(),
      this.clients
        .find(
          {
            state: {
              $in: [ClientState.SUBMITTED, ClientState.UNDER_REVIEW],
            },
          },
          { _id: 1, state: 1, submittedAt: 1 },
        )
        .lean()
        .exec(),
    ]);
    return [
      ...vendors.map((record) => this.queueItem("vendors", record)),
      ...clients.map((record) => this.queueItem("clients", record)),
    ].sort((left, right) => left.submittedAt.localeCompare(right.submittedAt));
  }

  async detail(type: CompanyType, id: string): Promise<Record<string, unknown>> {
    const record = await this.find(type, id);
    return this.authorisedDetail(record);
  }

  async documentUrl(
    type: CompanyType,
    id: string,
    kind: string,
  ): Promise<{ url: string; expiresAt: string }> {
    const record = await this.find(type, id);
    const documents = [
      ...record.documents,
      ...(type === "clients" &&
      "authorisedPerson" in record &&
      record.authorisedPerson?.governmentIdentityDocument
        ? [record.authorisedPerson.governmentIdentityDocument]
        : []),
    ];
    const document = documents.find((candidate) => candidate.kind === kind);
    if (!document) throw new NotFoundException("Document not found");
    let exists: boolean;
    try {
      exists = await this.storage.objectExists(document.objectKey);
    } catch {
      throw new ServiceUnavailableException(
        "Document storage is temporarily unavailable",
      );
    }
    if (!exists) {
      throw new NotFoundException("document not found in storage");
    }
    try {
      const signed = await this.storage.createSignedGetUrl({
        objectKey: document.objectKey,
        expiresInSeconds: COMPANY_DOCUMENT_GET_EXPIRY_SECONDS,
      });
      return {
        url: signed.url,
        expiresAt: new Date(
          Date.now() + COMPANY_DOCUMENT_GET_EXPIRY_SECONDS * 1_000,
        ).toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException(
        "Document storage is temporarily unavailable",
      );
    }
  }

  async decide(
    type: CompanyType,
    id: string,
    actorUserId: string,
    input: CompanyReviewDecisionInput,
  ): Promise<Record<string, unknown>> {
    this.assertObjectId(id);
    let session: ClientSession;
    try {
      session = await this.database.startSession();
    } catch {
      throw new ServiceUnavailableException(
        "Company transition could not be audit-logged",
      );
    }
    let decided: CompanyDocument | null = null;
    try {
      await session.withTransaction(async () => {
        const current = await this.find(type, id, session);
        this.assertReasonHasNoReviewedPii(input.reason, current);
        const toState = this.targetState(type, current.state, input.decision);
        decided = await this.conditionalTransition(
          type,
          id,
          current.state,
          toState,
          session,
        );
        if (!decided) {
          throw new BadRequestException(
            "Company state changed before this decision could be applied",
          );
        }
        await this.auditLogs.insert(
          {
            actorUserId,
            subjectCollection: type,
            subjectId: id,
            fromState: current.state,
            toState,
            reason: input.reason,
            occurredAt: new Date(),
          },
          session,
        );
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        "Company transition could not be audit-logged",
      );
    } finally {
      await session.endSession().catch(() => undefined);
    }
    if (!decided) {
      throw new ServiceUnavailableException(
        "Company transition could not be audit-logged",
      );
    }
    return this.authorisedDetail(decided);
  }

  private async find(
    type: CompanyType,
    id: string,
    session?: ClientSession,
  ): Promise<CompanyDocument> {
    this.assertObjectId(id);
    const query =
      type === "vendors"
        ? this.vendors.findById(id)
        : this.clients.findById(id);
    if (session) query.session(session);
    const record = await query.exec();
    if (!record) throw new NotFoundException("Company not found");
    return record;
  }

  private async conditionalTransition(
    type: CompanyType,
    id: string,
    fromState: VendorState | ClientState,
    toState: VendorState | ClientState,
    session: ClientSession,
  ): Promise<CompanyDocument | null> {
    if (type === "vendors") {
      const updated = await this.vendors
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(id),
            state: fromState as VendorState,
          },
          { $set: { state: toState as VendorState } },
          {
            returnDocument: "after",
            includeResultMetadata: false,
            runValidators: true,
            session,
          },
        )
        .exec();
      return updated as unknown as VendorDocument | null;
    }
    const updated = await this.clients
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          state: fromState as ClientState,
        },
        { $set: { state: toState as ClientState } },
        {
          returnDocument: "after",
          includeResultMetadata: false,
          runValidators: true,
          session,
        },
      )
      .exec();
    return updated as unknown as ClientDocument | null;
  }

  private targetState(
    type: CompanyType,
    fromState: VendorState | ClientState,
    decision: CompanyReviewDecisionInput["decision"],
  ): VendorState | ClientState {
    const toState =
      decision === "START_REVIEW"
        ? type === "vendors"
          ? VendorState.UNDER_REVIEW
          : ClientState.UNDER_REVIEW
        : decision === "REJECT"
          ? type === "vendors"
            ? VendorState.REJECTED
            : ClientState.REJECTED
          : decision === "REQUEST_MORE_INFO"
            ? type === "vendors"
              ? VendorState.MORE_INFO_NEEDED
              : ClientState.MORE_INFO_NEEDED
            : type === "clients"
              ? ClientState.APPROVED
              : undefined;
    if (
      toState === undefined ||
      (type === "vendors" &&
        !canTransitionVendor(fromState as VendorState, toState as VendorState)) ||
      (type === "clients" &&
        !canTransitionClient(fromState as ClientState, toState as ClientState))
    ) {
      throw new BadRequestException(
        "Decision is not permitted in the current company state",
      );
    }
    return toState;
  }

  private queueItem(
    companyType: CompanyType,
    record: { _id: Types.ObjectId; state: VendorState | ClientState; submittedAt?: Date },
  ): QueueItem {
    if (!record.submittedAt) {
      throw new Error("Queued company is missing submittedAt");
    }
    return {
      id: record._id.toHexString(),
      companyType,
      state: record.state,
      submittedAt: record.submittedAt.toISOString(),
    };
  }

  private authorisedDetail(record: CompanyDocument): Record<string, unknown> {
    const value = record.toObject() as unknown as Record<string, unknown>;
    const identifiers = value.countryIdentifiers;
    if (Array.isArray(identifiers)) {
      value.countryIdentifiers = identifiers.map((identifier) => {
        const visible = {
          ...(identifier as Record<string, unknown>),
        };
        delete visible.lookupDigest;
        return visible;
      });
    }
    return value;
  }

  private assertReasonHasNoReviewedPii(
    reason: string,
    record: CompanyDocument,
  ): void {
    const normalizedReason = normalize(reason);
    const knownValues = collectStrings(record.toObject());
    if (
      knownValues.some((value) => {
        const normalizedValue = normalize(value);
        return (
          normalizedValue.length >= 5 &&
          normalizedReason.includes(normalizedValue)
        );
      }) ||
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(reason) ||
      /(?:^|\s)\+?\d[\d\s().-]{7,}\d(?:\s|$)/.test(reason) ||
      hasCountryIdentifierPattern(reason)
    ) {
      throw new BadRequestException(
        "Reason must not contain reviewed or identifying data",
      );
    }
    // Pattern matching cannot identify every possible piece of PII. Verifiers
    // must still describe their reasoning without copying reviewed data.
  }

  private assertObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid company ID");
    }
  }
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (
    value !== null &&
    typeof value === "object" &&
    !(value instanceof Date) &&
    !(value instanceof Types.ObjectId)
  ) {
    return Object.entries(value).flatMap(([key, entry]) =>
      [
        "kind",
        "scheme",
        "countryCode",
        "currencyCode",
        "state",
        "taxonomySlug",
      ].includes(key)
        ? []
        : collectStrings(entry),
    );
  }
  return [];
}

function hasCountryIdentifierPattern(reason: string): boolean {
  const candidates = reason.match(/\b[A-Z0-9][A-Z0-9._/-]{6,}[A-Z0-9]\b/gi) ?? [];
  return candidates.some((candidate) => {
    const compact = candidate.replace(/[^A-Z0-9]/gi, "");
    return /[A-Z]/i.test(compact) && /\d/.test(compact);
  });
}
