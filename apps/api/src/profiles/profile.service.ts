import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  calculateProfileCompletionPercentage,
  ProfileState,
  type ProfileDraftInput,
} from "@eqourse/shared";

import { SkillTaxonomyModel } from "../database/skill-taxonomy.schema";
import { PROFILE_STORE } from "./profile.constants";
import type { ProfileDocument } from "./profile.schema";
import type { ProfileStore } from "./profile.store";

@Injectable()
export class ProfileService {
  constructor(@Inject(PROFILE_STORE) private readonly store: ProfileStore) {}

  async readOwn(userId: string) {
    const profile = await this.profile(userId);
    return this.response(profile);
  }

  async save(userId: string, input: ProfileDraftInput) {
    const current = await this.profile(userId);
    if (current.state !== ProfileState.DRAFT) {
      throw new BadRequestException("Profile cannot be edited in its current state");
    }
    await this.assertTaxonomySlugs(input);
    const updated = await this.store.updateDraft(userId, input);
    if (!updated) throw new NotFoundException("Profile not found");
    return this.response(updated);
  }

  private async profile(userId: string): Promise<ProfileDocument> {
    const profile = await this.store.findByUserId(userId);
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  private async assertTaxonomySlugs(input: ProfileDraftInput): Promise<void> {
    const slugs = [
      ...new Set(
        (input.skills ?? [])
          .map((skill) => skill.taxonomySlug)
          .filter((slug): slug is string => slug !== undefined),
      ),
    ];
    if (slugs.length === 0) return;
    const count = await SkillTaxonomyModel.countDocuments({ slug: { $in: slugs } }).exec();
    if (count !== slugs.length) {
      throw new BadRequestException("Every selected skill must exist in the taxonomy");
    }
  }

  private response(profile: ProfileDocument) {
    const value = profile.toObject({ versionKey: false });
    return {
      ...value,
      completionPercentage: calculateProfileCompletionPercentage(value),
    };
  }
}
