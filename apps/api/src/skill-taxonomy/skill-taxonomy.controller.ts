import {
  Controller,
  Get,
  Header,
  Inject,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { Public } from "../auth/public.decorator";
import {
  SkillTaxonomyService,
  type SkillTaxonomyOption,
} from "./skill-taxonomy.service";

@Public()
@Controller("api/v1/skill-taxonomy")
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class SkillTaxonomyController {
  constructor(
    @Inject(SkillTaxonomyService)
    private readonly skillTaxonomy: SkillTaxonomyService,
  ) {}

  @Get()
  @Header("Cache-Control", "public, max-age=300, s-maxage=3600")
  list(): Promise<SkillTaxonomyOption[]> {
    return this.skillTaxonomy.listActive();
  }
}
