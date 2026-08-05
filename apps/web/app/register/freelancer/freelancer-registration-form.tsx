"use client";

import {
  e164PhoneSchema,
  registrationRequestSchema,
  registrationVerifySchema,
  type RegistrationRequest,
} from "@eqourse/shared";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createCountryOptions,
  type CountryOption,
} from "../country-codes";

type Step = "details" | "verification" | "success";
type FieldName =
  | "countryCode"
  | "email"
  | "phone"
  | "pan"
  | "emailOtp"
  | "phoneOtp";
type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_ERROR_COPY: Record<FieldName, string> = {
  countryCode: "Choose your country.",
  email: "Enter a valid email address.",
  phone: "Enter a valid international phone number beginning with +.",
  pan: "Enter your PAN or leave this field blank.",
  emailOtp: "Enter the six-digit code sent to your email.",
  phoneOtp: "Enter the six-digit code sent by text message.",
};

function apiUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function describedBy(helperId: string, errorId: string, hasError: boolean) {
  return hasError ? `${helperId} ${errorId}` : helperId;
}

export function FreelancerRegistrationForm() {
  const [step, setStep] = useState<Step>("details");
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [identity, setIdentity] = useState<Pick<
    RegistrationRequest,
    "email" | "phone"
  > | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const countryRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const emailOtpRef = useRef<HTMLInputElement>(null);
  const phoneOtpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCountryOptions(createCountryOptions());
  }, []);

  const countriesReady = countryOptions.length > 0;

  function focusFirstError(nextErrors: FieldErrors): void {
    const refs: Partial<
      Record<FieldName, React.RefObject<HTMLInputElement | HTMLSelectElement>>
    > = {
      countryCode: countryRef,
      email: emailRef,
      phone: phoneRef,
      pan: panRef,
      emailOtp: emailOtpRef,
      phoneOtp: phoneOtpRef,
    };
    const first = (
      [
        "countryCode",
        "email",
        "phone",
        "pan",
        "emailOtp",
        "phoneOtp",
      ] as const
    ).find((field) => nextErrors[field]);

    if (first) queueMicrotask(() => refs[first]?.current?.focus());
  }

  function errorsFromIssues(
    issues: readonly { path: readonly PropertyKey[] }[],
  ): FieldErrors {
    const nextErrors: FieldErrors = {};
    for (const issue of issues) {
      const field = String(issue.path[0] ?? "") as FieldName;
      if (FIELD_ERROR_COPY[field]) nextErrors[field] = FIELD_ERROR_COPY[field];
    }
    return nextErrors;
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const candidate = {
      countryCode,
      email,
      phone,
      ...(pan.trim() ? { pan } : {}),
    };
    const result = registrationRequestSchema.safeParse(candidate);
    if (!result.success) {
      const nextErrors = errorsFromIssues(result.error.issues);
      if (!e164PhoneSchema.safeParse(phone).success) {
        nextErrors.phone = FIELD_ERROR_COPY.phone;
      }
      setErrors(nextErrors);
      setFormMessage("Check the highlighted fields and try again.");
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch(
        apiUrl("/api/v1/auth/register/request"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.data),
        },
      );

      if (!response.ok) {
        setFormMessage(
          response.status === 409
            ? "We could not start this registration. Check your details or try again later."
            : response.status === 429
              ? "Too many attempts. Wait a little, then try again."
              : "We could not send your verification codes. Try again.",
        );
        return;
      }

      setIdentity({ email: result.data.email, phone: result.data.phone });
      setPan("");
      setStep("verification");
    } catch {
      setFormMessage("We could not send your verification codes. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const result = registrationVerifySchema.safeParse({
      email: identity?.email ?? "",
      phone: identity?.phone ?? "",
      emailOtp,
      phoneOtp,
    });
    if (!result.success) {
      const nextErrors = errorsFromIssues(result.error.issues);
      setErrors(nextErrors);
      setFormMessage("Check the highlighted fields and try again.");
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/v1/auth/register/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        setFormMessage(
          response.status === 401
            ? "Those verification codes are invalid or have expired. Check both codes and try again."
            : response.status === 429
              ? "Too many attempts. Wait a little, then try again."
              : "We could not verify your codes. Try again.",
        );
        return;
      }

      setEmailOtp("");
      setPhoneOtp("");
      setIdentity(null);
      setStep("success");
    } catch {
      setFormMessage("We could not verify your codes. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeCountry(value: string): void {
    setCountryCode(value);
    if (value !== "IN") setPan("");
    if (errors.countryCode) {
      setErrors((current) => ({ ...current, countryCode: undefined }));
    }
  }

  function returnToDetails(): void {
    setEmailOtp("");
    setPhoneOtp("");
    setErrors({});
    setFormMessage("");
    setStep("details");
  }

  if (step === "success") {
    return (
      <div className="registration-form-shell registration-confirmation">
        <p className="home-eyebrow">Freelancer registration</p>
        <h1 id="freelancer-register-title">Your account is created.</h1>
        <p className="freelancer-hero-copy">
          Your email address and phone number are verified. Your account is
          under review.
        </p>
        <div className="home-hero-actions">
          <a className="home-freelancer-link" href="/">
            Return home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-form-shell">
      <p className="home-eyebrow">Freelancer registration</p>
      <h1 id="freelancer-register-title">
        {step === "details"
          ? "Create your freelancer account."
          : "Verify your contact details."}
      </h1>
      <p className="freelancer-hero-copy">
        {step === "details"
          ? "Enter your details, then verify both your email address and phone number."
          : "We sent a code to your email address and another to your phone."}
      </p>

      {step === "details" ? (
        <form className="registration-form" noValidate onSubmit={submitDetails}>
          <h2 className="home-section-title">Your details</h2>
          <div className="registration-field">
            <label htmlFor="registration-country">Country</label>
            <select
              ref={countryRef}
              id="registration-country"
              value={countryCode}
              disabled={!countriesReady || submitting}
              aria-busy={!countriesReady || undefined}
              aria-invalid={Boolean(errors.countryCode)}
              aria-describedby={describedBy(
                "registration-country-help",
                "registration-country-error",
                Boolean(errors.countryCode),
              )}
              onChange={(event) => changeCountry(event.target.value)}
            >
              <option value="">
                {countriesReady ? "Choose a country" : "Loading countries…"}
              </option>
              {countryOptions.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <p id="registration-country-help" className="registration-field-help">
              Choose the country where you live and work. This sets the
              verification path for your account.
            </p>
            {errors.countryCode ? (
              <p id="registration-country-error" className="registration-field-error">
                {errors.countryCode}
              </p>
            ) : null}
          </div>

          <div className="registration-field">
            <label htmlFor="registration-email">Email address</label>
            <input
              ref={emailRef}
              id="registration-email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={submitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy(
                "registration-email-help",
                "registration-email-error",
                Boolean(errors.email),
              )}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p id="registration-email-help" className="registration-field-help">
              We’ll send a verification code to this address.
            </p>
            {errors.email ? (
              <p id="registration-email-error" className="registration-field-error">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="registration-field">
            <label htmlFor="registration-phone">Phone number</label>
            <input
              ref={phoneRef}
              id="registration-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              disabled={submitting}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy(
                "registration-phone-help",
                "registration-phone-error",
                Boolean(errors.phone),
              )}
              onChange={(event) => setPhone(event.target.value)}
            />
            <p id="registration-phone-help" className="registration-field-help">
              Enter the full international number, including the leading + and
              country code.
            </p>
            {errors.phone ? (
              <p id="registration-phone-error" className="registration-field-error">
                {errors.phone}
              </p>
            ) : null}
          </div>

          {countryCode === "IN" ? (
            <div className="registration-field">
              <label htmlFor="registration-pan">PAN (optional)</label>
              <input
                ref={panRef}
                id="registration-pan"
                autoComplete="off"
                value={pan}
                disabled={submitting}
                aria-invalid={Boolean(errors.pan)}
                aria-describedby={describedBy(
                  "registration-pan-help",
                  "registration-pan-error",
                  Boolean(errors.pan),
                )}
                onChange={(event) => setPan(event.target.value)}
              />
              <p id="registration-pan-help" className="registration-field-help">
                For freelancers in India. Verification happens later.
              </p>
              {errors.pan ? (
                <p id="registration-pan-error" className="registration-field-error">
                  {errors.pan}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="registration-form-message" aria-live="polite">
            {formMessage}
          </p>
          <button className="registration-submit" type="submit" disabled={submitting}>
            {submitting ? "Sending verification codes…" : "Send verification codes"}
          </button>
        </form>
      ) : (
        <form className="registration-form" noValidate onSubmit={submitVerification}>
          <h2 className="home-section-title">Verification codes</h2>
          <div className="registration-field">
            <label htmlFor="registration-email-otp">Email verification code</label>
            <input
              ref={emailOtpRef}
              id="registration-email-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={emailOtp}
              disabled={submitting}
              aria-invalid={Boolean(errors.emailOtp)}
              aria-describedby={describedBy(
                "registration-email-otp-help",
                "registration-email-otp-error",
                Boolean(errors.emailOtp),
              )}
              onChange={(event) => setEmailOtp(event.target.value)}
            />
            <p id="registration-email-otp-help" className="registration-field-help">
              Enter the six-digit code sent to your email.
            </p>
            {errors.emailOtp ? (
              <p id="registration-email-otp-error" className="registration-field-error">
                {errors.emailOtp}
              </p>
            ) : null}
          </div>

          <div className="registration-field">
            <label htmlFor="registration-phone-otp">Phone verification code</label>
            <input
              ref={phoneOtpRef}
              id="registration-phone-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={phoneOtp}
              disabled={submitting}
              aria-invalid={Boolean(errors.phoneOtp)}
              aria-describedby={describedBy(
                "registration-phone-otp-help",
                "registration-phone-otp-error",
                Boolean(errors.phoneOtp),
              )}
              onChange={(event) => setPhoneOtp(event.target.value)}
            />
            <p id="registration-phone-otp-help" className="registration-field-help">
              Enter the six-digit code sent by text message.
            </p>
            {errors.phoneOtp ? (
              <p id="registration-phone-otp-error" className="registration-field-error">
                {errors.phoneOtp}
              </p>
            ) : null}
          </div>

          <p className="registration-form-message" aria-live="polite">
            {formMessage}
          </p>
          <div className="registration-form-actions">
            <button className="registration-submit" type="submit" disabled={submitting}>
              {submitting ? "Verifying…" : "Verify and create account"}
            </button>
            <button
              className="registration-secondary"
              type="button"
              disabled={submitting}
              onClick={returnToDetails}
            >
              Change details
            </button>
          </div>
        </form>
      )}

      <div className="home-hero-actions">
        <a className="home-freelancer-link" href="/register">
          Back to role choice
        </a>
      </div>
    </div>
  );
}
