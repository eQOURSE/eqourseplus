import type { Event } from "@sentry/nextjs";

const SENSITIVE_KEY =
  /^(?:authorization|cookie|set-cookie|email|otp|password|accessToken|refreshToken|token|secret|dsn|uri|url|connectionString)$/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Z0-9._~+/=-]+/gi;
const CREDENTIALED_URL =
  /\b([a-z][a-z0-9+.-]*):\/\/[^@\s/]+@([^\s]+)/gi;

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    return value
      .replace(BEARER_TOKEN, "Bearer [REDACTED]")
      .replace(CREDENTIALED_URL, "$1://[REDACTED]@$2")
      .replace(EMAIL, "[REDACTED_EMAIL]");
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : redact(item, seen),
    ]),
  );
}

export function redactSentryEvent<T extends Event>(event: T): T {
  return redact(event) as T;
}
