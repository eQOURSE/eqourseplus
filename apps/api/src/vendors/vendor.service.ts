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
  type VendorDraftInput,
} from "@eqourse/shared";
import { SkillTaxonomyModel } from "../database/skill-taxonomy.schema";

import { digestVendorIdentifier, loadVendorIdentifierHmacSecret } from "./vendor-identifier-digest";
import { VENDOR_IDENTIFIER_HMAC_SECRET } from "./vendor.constants";
import { type VendorDocument } from "./vendor.schema";
import { VENDOR_STORE, type VendorStore } from "./vendor.store";

type VendorIdentifierEnvironment = Record<string, string | undefined>;

@Injectable()
export class VendorService {
  constructor(
    @Inject(VENDOR_STORE) private readonly store: VendorStore,
    @Inject(VENDOR_IDENTIFIER_HMAC_SECRET)
    private readonly environment: VendorIdentifierEnvironment = process.env,
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
    if (input.countryIdentifiers) {
      const countryCode = (input.countryCode ?? current.countryCode)?.toUpperCase();
      if (!countryCode) throw new BadRequestException("Country is required for identifiers");
      patch.countryIdentifiers = input.countryIdentifiers.map((identifier) => ({
        scheme: identifier.scheme.trim().toUpperCase(),
        value: this.canonicalize(countryCode, identifier.scheme, identifier.value),
        lookupDigest: digestVendorIdentifier(
          countryCode,
          identifier.scheme,
          identifier.value,
          loadVendorIdentifierHmacSecret(this.environment),
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
    return this.store.markSubmitted(ownerUserId, vendor.submittedAt ?? new Date());
  }

  private canonicalize(countryCode: string, scheme: string, value: string): string {
    const requirements = getVendorCountryRequirements(countryCode);
    if (!requirements) throw new BadRequestException("Unsupported vendor country");
    try {
      return requirements.canonicalize(scheme.trim().toUpperCase(), value);
    } catch {
      throw new BadRequestException("Identifier scheme is not applicable to this country");
    }
  }

  private async assertComplete(vendor: VendorDocument): Promise<void> {
    const missing: string[] = [];
    const countryCode = vendor.countryCode;
    const requirements = countryCode ? getVendorCountryRequirements(countryCode) : undefined;
    if (!vendor.legalName || !countryCode || !vendor.registeredAddress || !vendor.contactPerson) {
      missing.push("business_details");
    }
    if (!vendor.bankDetails) missing.push("bank_details");
    if (!requirements) {
      missing.push("country_requirements");
    } else {
      const schemes = new Set(vendor.countryIdentifiers.map((identifier) => identifier.scheme));
      if (requirements.identifierSchemes.some((scheme) => !schemes.has(scheme))) {
        missing.push("country_identifiers");
      }
      const documentKinds = new Set(vendor.documents.map((document) => document.kind));
      if (requirements.documentKinds.some((kind) => !documentKinds.has(kind))) {
        missing.push("documents");
      }
    }
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
