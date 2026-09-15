import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { BusinessUnit } from "@eqourse/shared";
import type { Model } from "mongoose";

import {
  SkillTaxonomyStatus,
  type SkillTaxonomyRecord,
} from "../database/skill-taxonomy.schema";
import { SKILL_TAXONOMY_MODEL_NAME } from "./skill-taxonomy.constants";

export interface SkillTaxonomyOption {
  businessUnit: BusinessUnit;
  serviceLine: string;
  skill: string;
  specialization: string | null;
  slug: string;
}

@Injectable()
export class SkillTaxonomyService {
  constructor(
    @InjectModel(SKILL_TAXONOMY_MODEL_NAME)
    private readonly model: Model<SkillTaxonomyRecord>,
  ) {}

  async listActive(): Promise<SkillTaxonomyOption[]> {
    const rows = await this.model
      .find({ status: SkillTaxonomyStatus.ACTIVE })
      .select({
        _id: 0,
        businessUnit: 1,
        serviceLine: 1,
        skill: 1,
        specialization: 1,
        slug: 1,
      })
      .sort({
        businessUnit: 1,
        serviceLine: 1,
        skill: 1,
        specialization: 1,
        slug: 1,
      })
      .lean()
      .exec();

    return rows.map((row) => ({
      businessUnit: row.businessUnit,
      serviceLine: row.serviceLine,
      skill: row.skill,
      specialization: row.specialization ?? null,
      slug: row.slug,
    }));
  }
}
