import { Role, type AuthSession } from "@eqourse/shared";

// Extend this map when an internal role's own destination ships.
const INTERNAL_SURFACE_BY_ROLE: Readonly<Partial<Record<Role, string>>> = {
  [Role.VERIFIER]: "/company-reviews",
};

export function resolvePostSignInDestination(
  session: AuthSession,
  ownsVendor: boolean,
  ownsClient: boolean,
): string {
  if (ownsVendor || ownsClient) return "/dashboard";
  for (const assignment of session.roleAssignments) {
    const destination = INTERNAL_SURFACE_BY_ROLE[assignment.role];
    if (destination) return destination;
  }
  return "/dashboard";
}
