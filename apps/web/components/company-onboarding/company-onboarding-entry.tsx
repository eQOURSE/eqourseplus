"use client";

import type { AuthSession } from "@eqourse/shared";
import { GlassSubstrate } from "@eqourse/ui";
import { useState } from "react";

import { HomeFooter, HomeHeader } from "../home/HomeChrome";
import { PublicAmbientCanvas } from "../public/public-client-islands";
import { usePublicSession } from "../public/public-session-provider";
import { type CompanyActor } from "./company-onboarding-config";
import { CompanyOnboardingForm } from "./company-onboarding-form";

interface CompanyOnboardingEntryProps {
  actor: CompanyActor;
}

export function CompanyOnboardingEntry({ actor }: CompanyOnboardingEntryProps) {
  const initialSession = usePublicSession();
  const [session, setSession] = useState<AuthSession | null>(initialSession);

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
      {session ? (
        <HomeHeader session={session} onSignOut={() => void signOut()} />
      ) : (
        <HomeHeader />
      )}
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
