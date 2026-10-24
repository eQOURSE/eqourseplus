import * as Sentry from "@sentry/nextjs";

import { redactSentryEvent } from "./lib/sentry-redaction";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const environment =
  process.env.VERCEL_ENV?.trim() ||
  process.env.SENTRY_ENVIRONMENT?.trim() ||
  process.env.NODE_ENV?.trim() ||
  "development";

Sentry.init({
  dsn,
  environment,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  beforeSend: redactSentryEvent,
});
