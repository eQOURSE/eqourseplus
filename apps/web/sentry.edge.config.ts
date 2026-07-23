import * as Sentry from "@sentry/nextjs";

import { redactSentryEvent } from "./lib/sentry-redaction";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  beforeSend: redactSentryEvent,
});
