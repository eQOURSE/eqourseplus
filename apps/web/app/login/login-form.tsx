"use client";

import {
  authSessionSchema,
  otpRequestSchema,
  otpVerifySchema,
  type AuthSession,
} from "@eqourse/shared";
import { GlassButton } from "@eqourse/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { publicApiUrl } from "../../lib/public-api-url";

type Step = "email" | "otp";

interface LoginFormProps {
  navigate?: (href: string) => void;
}

function defaultNavigate(href: string): void {
  window.location.assign(href);
}

async function destinationFor(): Promise<string> {
  const [vendor, client] = await Promise.all([
    fetch("/api/v1/vendors/me", { cache: "no-store" }).catch(() => null),
    fetch("/api/v1/clients/me", { cache: "no-store" }).catch(() => null),
  ]);

  if (vendor?.ok) return "/register/vendor";
  if (client?.ok) return "/register/client";
  return "/register";
}

async function readSession(): Promise<AuthSession | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const parsed = authSessionSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

export function LoginForm({ navigate = defaultNavigate }: LoginFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void readSession()
      .then(async (session) => {
        if (!session) return;
        const destination = await destinationFor();
        if (active) navigate(destination);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [navigate]);

  async function requestOtp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = otpRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError("Enter a valid email address.");
      queueMicrotask(() => emailRef.current?.focus());
      return;
    }

    setEmailError("");
    setMessage("");
    let otpRequestUrl: string;
    try {
      otpRequestUrl = publicApiUrl("/api/v1/auth/otp/request");
    } catch {
      setMessage(
        "Sign-in is unavailable because this deployment is missing API configuration.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(otpRequestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error("OTP request failed");
      setVerifiedEmail(parsed.data.email);
      setEmail(parsed.data.email);
      setStep("otp");
      queueMicrotask(() => otpRef.current?.focus());
    } catch {
      setMessage("We couldn’t send a sign-in code. Please wait a moment and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = otpVerifySchema.safeParse({ email: verifiedEmail, otp });
    if (!parsed.success) {
      setOtpError("Enter the six-digit code sent to your email.");
      queueMicrotask(() => otpRef.current?.focus());
      return;
    }

    setOtpError("");
    setMessage("");
    setSubmitting(true);
    try {
      const verified = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!verified.ok) {
        setOtpError("That code is invalid or has expired. Request a new code and try again.");
        queueMicrotask(() => otpRef.current?.focus());
        return;
      }

      const session = await readSession();
      if (!session) throw new Error("Session load failed");
      navigate(await destinationFor());
    } catch {
      setMessage("We couldn’t complete sign-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "otp") {
    return (
      <form className="login-form" noValidate onSubmit={verifyOtp}>
        <p className="login-form-instruction">
          If an account uses <strong>{verifiedEmail}</strong>, a six-digit code was sent there.
        </p>
        <div className="company-onboarding-field">
          <label htmlFor="login-otp">Email sign-in code</label>
          <input
            ref={otpRef}
            id="login-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            disabled={submitting}
            aria-invalid={Boolean(otpError)}
            aria-describedby={otpError ? "login-otp-error" : undefined}
            onChange={(event) => setOtp(event.target.value)}
          />
          {otpError ? <p id="login-otp-error" className="company-onboarding-error" role="alert">{otpError}</p> : null}
        </div>
        <p className="registration-form-message" role={message ? "alert" : undefined} aria-live="polite">{message}</p>
        <div className="company-onboarding-actions">
          <GlassButton
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              setStep("email");
              setOtp("");
              setOtpError("");
              setMessage("");
            }}
          >
            Change email
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </GlassButton>
        </div>
      </form>
    );
  }

  return (
    <form className="login-form" noValidate onSubmit={requestOtp}>
      <div className="company-onboarding-field">
        <label htmlFor="login-email">Email address</label>
        <input
          ref={emailRef}
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={submitting}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "login-email-error" : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
        {emailError ? <p id="login-email-error" className="company-onboarding-error" role="alert">{emailError}</p> : null}
      </div>
      <p className="registration-form-message" role={message ? "alert" : undefined} aria-live="polite">{message}</p>
      <div className="company-onboarding-actions login-form-actions">
        <GlassButton type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Sending…" : "Send sign-in code"}
        </GlassButton>
        <a className="home-registration-link" href="/register">Create an account</a>
      </div>
    </form>
  );
}
