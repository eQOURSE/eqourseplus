import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../components/public/site-chrome";
import { LOGIN_DESCRIPTION, LOGIN_TITLE } from "./login-data";

export const metadata: Metadata = {
  title: LOGIN_TITLE,
  description: LOGIN_DESCRIPTION,
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <main id="top" className="home-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="login" />

      <section className="freelancer-hero" aria-labelledby="login-title">
        <div className="freelancer-hero-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">Account access</p>
          <h1 id="login-title">Log in to eQOURSE+.</h1>
          <p className="freelancer-hero-copy">
            Sign-in is not open yet. It opens when registration opens.
          </p>
          <div className="home-hero-actions">
            <a className="home-freelancer-link" href="/register">
              Go to registration
              <ArrowMark />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
