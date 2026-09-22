import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("FR-REG-02B profile same-origin routes", () => {
  it("proxies owner-only GET and PATCH requests to the existing API", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/api/v1/profiles/me/route.ts"),
      "utf8",
    );

    expect(source).toContain("proxyAuthenticatedApi");
    expect(source).toContain('"/api/v1/profiles/me", "GET"');
    expect(source).toContain('"/api/v1/profiles/me", "PATCH"');
    expect(source).not.toContain("POST");
  });
});
