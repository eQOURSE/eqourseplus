import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { skillTaxonomySchema } from "../database/skill-taxonomy.schema";
import { SKILL_TAXONOMY_MODEL_NAME } from "./skill-taxonomy.constants";
import { SkillTaxonomyController } from "./skill-taxonomy.controller";
import { SkillTaxonomyService } from "./skill-taxonomy.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SKILL_TAXONOMY_MODEL_NAME, schema: skillTaxonomySchema },
    ]),
  ],
  controllers: [SkillTaxonomyController],
  providers: [SkillTaxonomyService],
})
export class SkillTaxonomyModule {}
