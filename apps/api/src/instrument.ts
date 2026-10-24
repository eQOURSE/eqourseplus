import * as Sentry from "@sentry/nestjs";

import { redactSensitive } from "./observability/redaction";

const dsn = process.env.SENTRY_DSN?.trim();
const environment =
  process.env.SENTRY_ENVIRONMENT?.trim() ||
  process.env.NODE_ENV?.trim() ||
  "development";

Sentry.init({
  dsn,
  environment,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  beforeSend(event) {
    return redactSensitive(event) as typeof event;
  },
});
