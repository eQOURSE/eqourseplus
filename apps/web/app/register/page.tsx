import type { Metadata } from "next";
import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import {
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
  registrationRoles,
} from "./register-data";
import styles from "./register-page.module.css";

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

const roleVisuals = [
  { tag: "Talent", icon: "♙" },
  { tag: "Partner", icon: "▣" },
  { tag: "Client", icon: "▤" },
] as const;

export default function RegisterPage() {
  return (
    <main id="top" className={styles.page}>
      <HomeHeader brandHref="/" />

      <section className={styles.registrationSection} aria-labelledby="register-title">
        <div className={styles.registrationContent}>
          <span className={styles.radarLabel} aria-hidden="true">Radar // active</span>
          <p className={styles.eyebrow}>Registration</p>
          <h1 id="register-title" className={styles.title}>
            Choose how you&apos;ll work
            <br />
            with eQOURSE<em>+</em>.
          </h1>
          <p className={styles.description}>
            Choose the role that matches how you will work with eQOURSE+.
          </p>
          <div className={styles.roleGrid}>
            {registrationRoles.map((role, index) => (
              <a
                key={role.href}
                className={styles.registrationRoleCard}
                href={role.href}
              >
                <span className={styles.roleTop}>
                  <span className={styles.roleIcon} aria-hidden="true">{roleVisuals[index]?.icon ?? "●"}</span>
                  <span className={styles.roleTag}>{roleVisuals[index]?.tag ?? "Role"}</span>
                </span>
                <span className={styles.roleLabel}>
                  {role.label}
                  <span className={styles.roleArrow} aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
          <p className={styles.loginPrompt}>
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
