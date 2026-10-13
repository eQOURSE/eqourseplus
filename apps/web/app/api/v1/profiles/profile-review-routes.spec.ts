import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const routes = [
  ["reviews/route.ts", "/api/v1/profiles/reviews", "GET"],
  ["reviews/[id]/route.ts", "/api/v1/profiles/reviews/${params.id}", "GET"],
  ["reviews/[id]/decisions/route.ts", "/api/v1/profiles/reviews/${params.id}/decisions", "POST"],
] as const;

describe("FR-REG-07 same-origin profile review routes", () => {
  it.each(routes)("proxies %s through authenticated API transport", (file, upstream, method) => {
    const source = readFileSync(resolve(process.cwd(), "app/api/v1/profiles", file), "utf8");
    expect(source).toContain("proxyAuthenticatedApi");
    expect(source).toContain(upstream);
    expect(source).toContain(`"${method}"`);
    expect(source).not.toContain("publicApiUrl");
  });
});
