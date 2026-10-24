import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Role, authSessionSchema } from "@eqourse/shared";

import {
  ACCESS_COOKIE,
  readSession,
} from "../../api/auth/_lib/session-transport";

export const metadata: Metadata = {
  title: "Observability check | eQOURSE+",
  robots: { index: false, follow: false },
};

export default async function ObservabilityCheckPage(): Promise<never | null> {
  const accessToken = cookies().get(ACCESS_COOKIE)?.value;
  const response = await readSession(accessToken);
  if (!response.ok) {
    redirect("/login");
    return null;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    redirect("/login");
    return null;
  }

  const session = authSessionSchema.safeParse(body);
  const isInternal = session.success && session.data.roleAssignments.some(
    (assignment) => assignment.role === Role.SUPER_ADMIN,
  );
  if (!isInternal) {
    redirect("/dashboard");
    return null;
  }

  throw new Error("FR-FND-06 deliberate web observability check");
}
