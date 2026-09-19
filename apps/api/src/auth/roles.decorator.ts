import { SetMetadata } from "@nestjs/common";
import { Role, type BusinessUnit } from "@eqourse/shared";

import { REQUIRED_ROLE } from "./auth.constants";

export interface RequiredRole {
  role: Role;
  businessUnit: BusinessUnit;
}

export interface CompanyVerifierRole {
  role: Role.VERIFIER;
  companyVerification: true;
}

export type RoleRequirement = RequiredRole | CompanyVerifierRole;

export const Roles = (
  role: Role,
  businessUnit: BusinessUnit,
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_ROLE, { role, businessUnit } satisfies RequiredRole);

export const CompanyVerifier = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_ROLE, {
    role: Role.VERIFIER,
    companyVerification: true,
  } satisfies CompanyVerifierRole);
