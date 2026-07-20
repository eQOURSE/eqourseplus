import { SetMetadata } from "@nestjs/common";
import type { BusinessUnit, Role } from "@eqourse/shared";

import { REQUIRED_ROLE } from "./auth.constants";

export interface RequiredRole {
  role: Role;
  businessUnit: BusinessUnit;
}

export const Roles = (
  role: Role,
  businessUnit: BusinessUnit,
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_ROLE, { role, businessUnit } satisfies RequiredRole);
