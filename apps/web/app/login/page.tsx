import type { Metadata } from "next";
import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import { LoginForm } from "./login-form";
import { LOGIN_DESCRIPTION, LOGIN_TITLE } from "./login-data";
import styles from "./login-page.module.css";

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
    <main id="top" className={styles.page}>
      <HomeHeader brandHref="/" />

      <section className={styles.accessSection} aria-labelledby="login-title">
        <div className={styles.accessContent}>
          <p className={styles.eyebrow}>Account access</p>
          <h1 id="login-title" className={styles.title}>
            <span>Log in to</span>{" "}
            <span>eQOURSE<em>+</em>.</span>
          </h1>
          <p className={styles.description}>
            Enter your account email and we&apos;ll send you a secure sign-in code.
          </p>
          <div className={styles.loginCard}>
            <LoginForm />
          </div>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
