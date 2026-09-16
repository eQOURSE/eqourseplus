import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  VendorState,
  canTransitionVendor,
  getVendorCountryRequirements,
  type VendorUploadRequest,
  type VendorUploadResponse,
  type VendorDraftInput,
} from "@eqourse/shared";
import type { StorageAdapter } from "@eqourse/adapters";
import { SkillTaxonomyModel } from "../database/skill-taxonomy.schema";
import {
  assertDocumentKey,
  canonicalizeCompanyIdentifier,
  createCompanyUpload,
  missingCompanyRequirements,
} from "../company-registration/company-registration";

import { digestVendorIdentifier } from "./vendor-identifier-digest";
import {
  STORAGE_ADAPTER,
  VENDOR_IDENTIFIER_HMAC_SECRET,
} from "./vendor.constants";
import { type VendorDocument } from "./vendor.schema";
import { VENDOR_STORE, type VendorStore } from "./vendor.store";

@Injectable()
export class VendorService {
  constructor(
    @Inject(VENDOR_STORE) private readonly store: VendorStore,
    @Inject(VENDOR_IDENTIFIER_HMAC_SECRET)
    private readonly hmacSecret: string,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  async createDraft(ownerUserId: string, input: VendorDraftInput): Promise<VendorDocument> {
    const draft = await this.store.createDraft(ownerUserId);
    if (Object.keys(input).length === 0) return draft;
    return this.save(ownerUserId, input);
  }

  readOwn(ownerUserId: string): Promise<VendorDocument> {
    return this.store.findByOwner(ownerUserId).then((vendor) => {
      if (!vendor) throw new NotFoundException("Vendor not found");
      return vendor;
    });
  }

  async save(ownerUserId: string, input: VendorDraftInput): Promise<VendorDocument> {
    const current = await this.readOwn(ownerUserId);
    if (![VendorState.DRAFT, VendorState.MORE_INFO_NEEDED].includes(current.state)) {
      throw new BadRequestException("Vendor cannot be edited in its current state");
    }

    const patch = { ...input } as VendorDraftInput;
    if (input.documents) {
      for (const document of input.documents) {
        const expectedPrefix = `vendors/${current._id.toString()}/${document.kind}/`;
        assertDocumentKey(document.objectKey, expectedPrefix, "vendor");
      }
    }
    if (input.countryIdentifiers) {
      const countryCode = (input.countryCode ?? current.countryCode)?.toUpperCase();
      if (!countryCode) throw new BadRequestException("Country is required for identifiers");
      patch.countryIdentifiers = input.countryIdentifiers.map((identifier) => ({
        scheme: identifier.scheme.trim().toUpperCase(),
        value: canonicalizeCompanyIdentifier(countryCode, identifier.scheme, identifier.value, "vendor"),
        lookupDigest: digestVendorIdentifier(
          countryCode,
          identifier.scheme,
          identifier.value,
          this.hmacSecret,
        ),
      }));
    }
    return this.store.updateDraft(ownerUserId, patch);
  }

  async submit(ownerUserId: string): Promise<VendorDocument> {
    const vendor = await this.readOwn(ownerUserId);
    if (!canTransitionVendor(vendor.state, VendorState.SUBMITTED)) {
      throw new BadRequestException("Vendor cannot be submitted in its current state");
    }
    await this.assertComplete(vendor);
    const submitted = await this.store.markSubmitted(
      vendor._id,
      vendor.submittedAt ?? new Date(),
    );
    if (!submitted) {
      throw new BadRequestException("Vendor cannot be submitted in its current state");
    }
    return submitted;
  }

  async createDocumentUpload(
    ownerUserId: string,
    input: VendorUploadRequest,
  ): Promise<VendorUploadResponse> {
    const vendor = await this.readOwn(ownerUserId);
    if (![VendorState.DRAFT, VendorState.MORE_INFO_NEEDED].includes(vendor.state)) {
      throw new BadRequestException("Vendor documents cannot be changed in its current state");
    }
    const requirements = vendor.countryCode
      ? getVendorCountryRequirements(vendor.countryCode)
      : undefined;
    if (!requirements?.documentKinds.includes(input.kind)) {
      throw new BadRequestException("Document kind is not applicable to this country");
    }

    return createCompanyUpload(
      this.storage,
      `vendors/${vendor._id.toString()}/${input.kind}/`,
      input,
    );
  }

  private async assertComplete(vendor: VendorDocument): Promise<void> {
    const missing: string[] = [];
    const countryCode = vendor.countryCode;
    const requirements = countryCode ? getVendorCountryRequirements(countryCode) : undefined;
    if (!vendor.legalName || !countryCode || !vendor.registeredAddress || !vendor.contactPerson) {
      missing.push("business_details");
    }
    if (!vendor.bankDetails) missing.push("bank_details");
    missing.push(...missingCompanyRequirements(vendor.countryIdentifiers, vendor.documents, requirements));
    const capabilities = vendor.capabilities.map((capability) => capability.taxonomySlug);
    if (capabilities.length === 0) {
      missing.push("capabilities");
    } else {
      const available = await SkillTaxonomyModel.countDocuments({
        slug: { $in: capabilities },
      });
      if (available !== new Set(capabilities).size) missing.push("capabilities");
    }
    if (missing.length > 0) {
      throw new BadRequestException({
        message: "Vendor is missing required submission information",
        missing,
      });
    }
  }
}
