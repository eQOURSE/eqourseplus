import type { Metadata } from "next";

import { HomeFooter, HomeHeader } from "../../../components/home/HomeChrome";
import { FREELANCER_REGISTER_DESCRIPTION, FREELANCER_REGISTER_TITLE } from "../register-data";
import { FreelancerRegistrationForm } from "./freelancer-registration-form";
import styles from "./freelancer-registration-page.module.css";

export const metadata: Metadata = {
  title: FREELANCER_REGISTER_TITLE,
  description: FREELANCER_REGISTER_DESCRIPTION,
  alternates: { canonical: "/register/freelancer" },
  robots: { index: false, follow: true },
};

export default function FreelancerRegistrationPage() {
  return <main id="top" className={styles.page}>
    <HomeHeader brandHref="/" />
    <div className={styles.registrationLayout}>
      <aside className={styles.context}>
        <p className={styles.eyebrow}>● FREELANCER REGISTRATION</p>
        <h1>Create your <span>freelancer account.</span></h1>
        <p className={styles.contextCopy}>Enter your details, then verify your email address. Join an elite network of verified tech, product, and AI specialists.</p><div className={styles.protocol}><div className={styles.radar} aria-hidden="true"><i /><i /><i />
        </div>
          <div className={styles.protocolContent}>
            <h2>♧ <span>Enterprise Talent Protocol</span></h2>
            <p>Direct client contracts, automated global payroll, and sovereign credential verification built for modern remote builders.</p>
            <div>
              <span>NETWORK LATENCY<strong>Global</strong></span>
              <span>COMPLIANCE STATUS<strong>● ACTIVE</strong></span>
            </div>
          </div>
        </div>
        <a className={styles.backLink} href="/register">← Back to role choice</a>
      </aside>
      <section className={styles.formColumn} aria-labelledby="freelancer-register-title">
        <FreelancerRegistrationForm />
      </section>
    </div>
    <HomeFooter />
  </main>;
}
