import * as Sentry from "@sentry/nestjs";

import { redactSensitive } from "./observability/redaction";
import {
  dropSensitiveSmsBreadcrumb,
  isSensitiveSmsProviderRequest,
} from "./observability/sentry-sms-redaction";

const dsn = process.env.SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  integrations(defaultIntegrations) {
    return defaultIntegrations.map((integration) =>
      integration.name === "NodeFetch"
        ? Sentry.nativeNodeFetchIntegration({
            ignoreOutgoingRequests: isSensitiveSmsProviderRequest,
          })
        : integration,
    );
  },
  beforeBreadcrumb(breadcrumb) {
    return dropSensitiveSmsBreadcrumb(breadcrumb);
  },
  beforeSend(event) {
    return redactSensitive(event) as typeof event;
  },
});
