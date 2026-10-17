"use client";

import type { AuthSession } from "@eqourse/shared";
import { GlassButton, GlassNav, ThemeToggle } from "@eqourse/ui";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { HomeFooter, HomeHeader } from "../home/HomeChrome";

interface AuthenticatedShellProps {
  children: ReactNode;
  initialSession?: AuthSession;
  navigate?: (href: string) => void;
}

const AuthenticatedSessionContext = createContext<AuthSession | null>(null);

export function useAuthenticatedSession(): AuthSession {
  const session = useContext(AuthenticatedSessionContext);
  if (!session) throw new Error("Authenticated session is unavailable");
  return session;
}

function defaultNavigate(href: string): void {
  window.location.assign(href);
}

export function AuthenticatedShell({
  children,
  initialSession,
  navigate = defaultNavigate,
}: AuthenticatedShellProps) {
  const [session, setSession] = useState<AuthSession | null>(initialSession ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(initialSession ? "ready" : "loading");
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const refreshedProfilePage = pathname === "/profile" || pathname === "/profile-reviews";

  useEffect(() => {
    if (initialSession) return;
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (active) navigate("/login");
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
  }, [initialSession, navigate]);

  async function signOut(): Promise<void> {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      navigate("/login");
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

  if (refreshedProfilePage) {
    return (
      <div className="q q-page profile-workspace">
        <a className="q-skip" href="#main-content">Skip to content</a>
        <HomeHeader session={session} onSignOut={() => void signOut()} />
        <AuthenticatedSessionContext.Provider value={session}>
          <main id="main-content" className="q-container profile-workspace-content">{children}</main>
        </AuthenticatedSessionContext.Provider>
        <HomeFooter />
      </div>
    );
  }

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
      <AuthenticatedSessionContext.Provider value={session}>
        <main className="authenticated-shell-content">{children}</main>
      </AuthenticatedSessionContext.Provider>
    </div>
  );
}
