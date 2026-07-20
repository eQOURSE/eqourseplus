import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@eqourse/shared";

import { REQUIRED_ROLE } from "./auth.constants";
import type { AuthenticatedRequest } from "./auth.types";
import type { RequiredRole } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<RequiredRole>(
      REQUIRED_ROLE,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) return true;

    const user = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().authUser;
    if (!user) return false;
    if (
      user.roleAssignments.some(
        (assignment) => assignment.role === Role.SUPER_ADMIN,
      )
    ) {
      return true;
    }
    return user.roleAssignments.some(
      (assignment) =>
        assignment.role === requirement.role &&
        assignment.businessUnit === requirement.businessUnit,
    );
  }
}
