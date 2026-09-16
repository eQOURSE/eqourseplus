import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const routeCases = [
  ["route.ts", "/api/v1/clients"],
  ["me/route.ts", "/api/v1/clients/me"],
  ["me/submit/route.ts", "/api/v1/clients/me/submit"],
  ["me/documents/upload-url/route.ts", "/api/v1/clients/me/documents/upload-url"],
  [
    "me/authorised-person/government-identity-document/upload-url/route.ts",
    "/api/v1/clients/me/authorised-person/government-identity-document/upload-url",
  ],
] as const;

describe("FR-REG-15 client same-origin routes", () => {
  it.each(routeCases)("proxies %s to %s", (file, upstreamPath) => {
    const source = readFileSync(resolve(process.cwd(), "app/api/v1/clients", file), "utf8");

    expect(source).toContain("proxyAuthenticatedApi");
    expect(source).toContain(`"${upstreamPath}"`);
  });
});
