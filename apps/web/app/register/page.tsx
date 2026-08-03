import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../components/public/site-chrome";
import {
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
  registrationRoles,
} from "./register-data";

export const metadata: Metadata = {
  title: REGISTER_TITLE,
  description: REGISTER_DESCRIPTION,
  alternates: {
    canonical: "/register",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return (
    <main id="top" className="home-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="register" />

      <section className="freelancer-hero" aria-labelledby="register-title">
        <div className="freelancer-hero-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">Registration</p>
          <h1 id="register-title">Choose how you&apos;ll work with eQOURSE+.</h1>
          <p className="freelancer-hero-copy">
            Registration is not open yet. Choose the role you would register
            under.
          </p>
          <div className="home-audience-links">
            {registrationRoles.map((role) => (
              <a
                key={role.href}
                className="home-freelancer-link"
                href={role.href}
              >
                {role.label}
                <ArrowMark />
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
