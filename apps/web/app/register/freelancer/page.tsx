import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../../components/public/public-client-islands";
import {
  ArrowMark,
  SiteFooter,
  SiteNavigation,
} from "../../../components/public/site-chrome";
import { CountrySelectStub } from "../country-select-stub";
import {
  FREELANCER_REGISTER_DESCRIPTION,
  FREELANCER_REGISTER_TITLE,
} from "../register-data";

export const metadata: Metadata = {
  title: FREELANCER_REGISTER_TITLE,
  description: FREELANCER_REGISTER_DESCRIPTION,
  alternates: {
    canonical: "/register/freelancer",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function FreelancerRegistrationPage() {
  return (
    <main id="top" className="home-shell">
      <PublicAmbientCanvas />
      <GlassSubstrate />
      <SiteNavigation page="register" />

      <section
        className="freelancer-hero"
        aria-labelledby="freelancer-register-title"
      >
        <div className="freelancer-hero-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="freelancer-hero-content">
          <p className="home-eyebrow">Freelancer registration</p>
          <h1 id="freelancer-register-title">Freelancer registration.</h1>
          <p className="freelancer-hero-copy">
            Freelancer registration is not open yet. eQOURSE+ is being built,
            and sign-up will open here.
          </p>
          <CountrySelectStub />
          <div className="home-hero-actions">
            <a className="home-freelancer-link" href="/register">
              Back to role choice
              <ArrowMark />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
