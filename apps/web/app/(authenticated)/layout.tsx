import type { ReactNode } from "react";

import { AuthenticatedShell } from "../../components/authenticated/authenticated-shell";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
