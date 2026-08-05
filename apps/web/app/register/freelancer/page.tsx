import type { Metadata } from "next";
import { GlassSubstrate } from "@eqourse/ui";

import { PublicAmbientCanvas } from "../../../components/public/public-client-islands";
import {
  SiteFooter,
  SiteNavigation,
} from "../../../components/public/site-chrome";
import {
  FREELANCER_REGISTER_DESCRIPTION,
  FREELANCER_REGISTER_TITLE,
} from "../register-data";
import { FreelancerRegistrationForm } from "./freelancer-registration-form";

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
          <FreelancerRegistrationForm />
          <noscript>
            <p className="registration-noscript">
              Registration requires JavaScript. Enable JavaScript in your
              browser, then reload this page to continue.
            </p>
          </noscript>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
