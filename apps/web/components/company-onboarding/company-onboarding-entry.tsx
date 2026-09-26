"use client";

import { authSessionSchema, type AuthSession } from "@eqourse/shared";
import { GlassSubstrate } from "@eqourse/ui";
import { useEffect, useState } from "react";

import { HomeFooter, HomeHeader } from "../home/HomeChrome";
import { PublicAmbientCanvas } from "../public/public-client-islands";
import { type CompanyActor } from "./company-onboarding-config";
import { CompanyOnboardingForm } from "./company-onboarding-form";

interface CompanyOnboardingEntryProps {
  actor: CompanyActor;
}

export function CompanyOnboardingEntry({ actor }: CompanyOnboardingEntryProps) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const parsed = authSessionSchema.safeParse(await response.json());
        return parsed.success ? parsed.data : null;
      })
      .catch(() => null)
      .then((nextSession) => {
        if (active) setSession(nextSession);
      });
    return () => {
      active = false;
    };
  }, []);

  async function signOut(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <main id="top" className="home-shell vendor-registration-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <HomeHeader {...(session ? { session, onSignOut: () => void signOut() } : {})} />
      <div className="company-onboarding-page">
        <CompanyOnboardingForm
          actor={actor}
          {...(session ? {} : { guest: true })}
          onAuthenticated={setSession}
        />
        {!session ? <div className="home-hero-actions"><a className="home-registration-link" href="/register">← Back to role choice</a></div> : null}
      </div>
      <HomeFooter />
    </main>
  );
}
