import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("FR-FND-06 same-origin API observability route", () => {
  it("proxies the browser session to the guarded API check", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/api/v1/internal/observability-check/route.ts"),
      "utf8",
    );

    expect(source).toContain("proxyAuthenticatedApi");
    expect(source).toContain("/api/v1/internal/observability-check");
    expect(source).toContain('"GET"');
    expect(source).not.toContain("publicApiUrl");
  });
});
