import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const routes = [
  ["route.ts", "/api/v1/company-reviews", "GET"],
  ["[type]/[id]/route.ts", "/api/v1/company-reviews/${type}/${id}", "GET"],
  ["[type]/[id]/documents/[kind]/url/route.ts", "/api/v1/company-reviews/${type}/${id}/documents/${kind}/url", "GET"],
  ["[type]/[id]/decisions/route.ts", "/api/v1/company-reviews/${type}/${id}/decisions", "POST"],
] as const;

describe("FR-REG-07A same-origin company review routes", () => {
  it.each(routes)("proxies %s to the authenticated API", (file, upstream, method) => {
    const source = readFileSync(resolve(process.cwd(), "app/api/v1/company-reviews", file), "utf8");
    expect(source).toContain("proxyAuthenticatedApi");
    expect(source).toContain(upstream);
    expect(source).toContain(`"${method}"`);
    expect(source).not.toContain("publicApiUrl");
  });
});
