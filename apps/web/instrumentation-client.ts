import * as Sentry from "@sentry/nextjs";

import { redactSentryEvent } from "./lib/sentry-redaction";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const environment =
  process.env.NEXT_PUBLIC_VERCEL_ENV?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
  "development";

Sentry.init({
  dsn,
  environment,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  beforeSend: redactSentryEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
