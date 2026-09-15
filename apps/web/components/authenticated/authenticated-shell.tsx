"use client";

import type { AuthSession } from "@eqourse/shared";
import { GlassButton, GlassNav, ThemeToggle } from "@eqourse/ui";
import { useEffect, useState, type ReactNode } from "react";

interface AuthenticatedShellProps {
  children: ReactNode;
  initialSession?: AuthSession;
}

export function AuthenticatedShell({ children, initialSession }: AuthenticatedShellProps) {
  const [session, setSession] = useState<AuthSession | null>(initialSession ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(initialSession ? "ready" : "loading");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (initialSession) return;
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (active) window.location.assign("/login");
          return;
        }
        const nextSession = (await response.json()) as AuthSession;
        if (active) {
          setSession(nextSession);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [initialSession]);

  async function signOut(): Promise<void> {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  if (status === "loading") {
    return <p className="authenticated-shell-status">Loading your workspace…</p>;
  }

  if (status === "error") {
    return (
      <p className="authenticated-shell-status" role="alert">
        We could not load your workspace. Refresh and try again.
      </p>
    );
  }

  if (!session) return null;

  return (
    <div className="authenticated-shell">
      <GlassNav className="authenticated-shell-nav" aria-label="Application navigation">
        <a className="home-wordmark home-nav-link" href="/">
          eQOURSE<span aria-hidden="true">+</span>
        </a>
        <div className="authenticated-shell-actions">
          <span className="authenticated-shell-email">{session.email}</span>
          <ThemeToggle />
          <GlassButton
            type="button"
            variant="secondary"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </GlassButton>
        </div>
      </GlassNav>
      <main className="authenticated-shell-content">{children}</main>
    </div>
  );
}
