const SENSITIVE_KEY =
  /^(?:authorization|cookie|set-cookie|email|otp|password|accessToken|refreshToken|token|secret|dsn|uri|url|connectionString)$/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Z0-9._~+/=-]+/gi;
const CREDENTIALED_URL =
  /\b([a-z][a-z0-9+.-]*):\/\/[^@\s/]+@([^\s]+)/gi;

function redactString(value: string): string {
  return value
    .replace(BEARER_TOKEN, "Bearer [REDACTED]")
    .replace(CREDENTIALED_URL, "$1://[REDACTED]@$2")
    .replace(EMAIL, "[REDACTED_EMAIL]");
}

export function redactSensitive(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined" ||
    typeof value === "bigint"
  ) {
    return value;
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[CIRCULAR]";
    }
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactSensitive(item, seen),
      ]),
    );
  }
  return redactString(String(value));
}
