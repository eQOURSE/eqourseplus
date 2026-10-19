"use client";

import type { AuthSession } from "@eqourse/shared";
import { createContext, useContext, type ReactNode } from "react";

const PublicSessionContext = createContext<AuthSession | null>(null);

export function PublicSessionProvider({
  session,
  children,
}: {
  session: AuthSession | null;
  children: ReactNode;
}) {
  return <PublicSessionContext.Provider value={session}>{children}</PublicSessionContext.Provider>;
}

export function usePublicSession(): AuthSession | null {
  return useContext(PublicSessionContext);
}
