// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./[...path]/route";

vi.mock("../../../lib/api-fetch", () => ({ apiFetch: vi.fn() }));
import { apiFetch } from "../../../lib/api-fetch";

const upstream = vi.mocked(apiFetch);
const origin = "https://plus.eqourse.test";

beforeEach(() => {
  vi.stubEnv("APP_URL", origin);
  upstream.mockReset();
});

describe("assessment same-origin transport", () => {
  it("forwards a cookie token only in the upstream authorization header", async () => {
    upstream.mockResolvedValueOnce(new Response(JSON.stringify([{ taxonomySlug: "example" }]), { status: 200 }));
    const req = new NextRequest(`${origin}/api/tests/catalog`, { headers: { cookie: "__Host-eqourse-access=secret-token" } });
    const response = await GET(req, { params: { path: ["catalog"] } });
    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain("secret-token");
    expect(new Headers(upstream.mock.calls[0]?.[1]?.headers).get("authorization")).toBe("Bearer secret-token");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects a cross-origin submission before touching the API", async () => {
    const req = new NextRequest(`${origin}/api/tests/slug/attempts`, {
      method: "POST", headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
      body: "{}",
    });
    const response = await POST(req, { params: { path: ["slug", "attempts"] } });
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
});
