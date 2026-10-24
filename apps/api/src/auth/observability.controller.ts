import { Controller, Get } from "@nestjs/common";
import { BusinessUnit, Role } from "@eqourse/shared";

import { Roles } from "./roles.decorator";

@Controller("api/v1/internal")
@Roles(Role.SUPER_ADMIN, BusinessUnit.EQOURSE)
export class ObservabilityController {
  @Get("observability-check")
  throwKnownError(): never {
    throw new Error("FR-FND-06 deliberate API observability check");
  }
}
