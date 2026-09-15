"use client";

import { authSessionSchema, type AuthSession } from "@eqourse/shared";
import { GlassSubstrate } from "@eqourse/ui";
import { useEffect, useState } from "react";

import { AuthenticatedShell } from "../authenticated/authenticated-shell";
import { PublicAmbientCanvas } from "../public/public-client-islands";
import { ArrowMark, SiteFooter, SiteNavigation } from "../public/site-chrome";
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

  if (session) {
    return (
      <AuthenticatedShell initialSession={session}>
        <div className="company-onboarding-page">
          <CompanyOnboardingForm actor={actor} />
        </div>
      </AuthenticatedShell>
    );
  }

  return (
    <main id="top" className="home-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="register" />
      <div className="company-onboarding-page">
        <CompanyOnboardingForm
          actor={actor}
          guest
          onAuthenticated={setSession}
        />
        <div className="home-hero-actions">
          <a className="home-registration-link" href="/register">
            Back to role choice
            <ArrowMark />
          </a>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
