import * as Sentry from "@sentry/nestjs";

import { redactSensitive } from "./observability/redaction";

const dsn = process.env.SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  beforeSend(event) {
    return redactSensitive(event) as typeof event;
  },
});
