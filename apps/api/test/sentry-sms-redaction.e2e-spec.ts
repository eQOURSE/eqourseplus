import { describe, expect, it } from "vitest";

import {
  dropSensitiveSmsBreadcrumb,
  isSensitiveSmsProviderRequest,
} from "../src/observability/sentry-sms-redaction";

const sensitiveUrl =
  "https://amazesms.in/api/pushsms?user=profile&authkey=secret&mobile=%2B919876543210&text=123456";

describe("FR-REG-01 AmazeSMS Sentry exclusion", () => {
  it("excludes the complete AmazeSMS push URL from outgoing request instrumentation", () => {
    expect(isSensitiveSmsProviderRequest(sensitiveUrl)).toBe(true);
    expect(
      isSensitiveSmsProviderRequest("https://amazesms.in/api/balance?user=profile"),
    ).toBe(false);
    expect(
      isSensitiveSmsProviderRequest("https://example.com/api/pushsms?text=123456"),
    ).toBe(false);
  });

  it("drops an AmazeSMS HTTP breadcrumb rather than retaining its URL or query", () => {
    const breadcrumb = {
      category: "http",
      data: {
        url: "https://amazesms.in/api/pushsms",
        "http.query": "?authkey=secret&mobile=%2B919876543210&text=123456",
      },
    };

    expect(dropSensitiveSmsBreadcrumb(breadcrumb)).toBeNull();
  });

  it("preserves unrelated Sentry breadcrumbs", () => {
    const breadcrumb = {
      category: "http",
      data: { url: "https://api.resend.com/emails" },
    };

    expect(dropSensitiveSmsBreadcrumb(breadcrumb)).toBe(breadcrumb);
  });
});
