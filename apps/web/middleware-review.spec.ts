// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it, vi, afterEach } from "vitest";
import { middleware } from "./middleware";

const session = { userId: "507f1f77bcf86cd799439011", email: "owner@example.com", roleAssignments: [], profileState: "DRAFT" };
const request = (path: string, cookie = "") => new NextRequest(`https://plus.eqourse.test${path}`, { headers: cookie ? { cookie } : {} });

describe("FR-REG-02D review regressions", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("does not rotate one refresh token twice for concurrent public requests", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    let rotations = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: URL, options?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/auth/refresh")) {
        rotations += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return rotations === 1
          ? new Response(JSON.stringify({ accessToken: "renewed", refreshToken: "replacement" }), { status: 200 })
          : new Response(null, { status: 401 });
      }
      return options?.headers && JSON.stringify(options.headers).includes("renewed")
        ? new Response(JSON.stringify(session), { status: 200 })
        : new Response(null, { status: 401 });
    }));
    const cookie = "__Host-eqourse-access=expired; __Host-eqourse-refresh=old-refresh";
    const [first, second] = await Promise.all([middleware(request("/about", cookie)), middleware(request("/vendors", cookie))]);
    expect(rotations).toBe(1);
    for (const response of [first, second]) {
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-request-x-eqourse-public-session")).toContain(session.email);
      expect(response.headers.get("set-cookie")).toContain("replacement");
    }
  });

  it.each(["client", "vendor"])("keeps %s MORE_INFO_NEEDED registration editable", async (actor) => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => new Response(JSON.stringify(
      String(url).endsWith(`/${actor}s/me`) ? { state: "MORE_INFO_NEEDED" } : session,
    ), { status: 200 })));
    const response = await middleware(request(`/register/${actor}`, "__Host-eqourse-access=valid"));
    expect(response.status).toBe(200);
  });

  it.each(["DRAFT", "SUBMITTED"])("routes vendor %s correctly", async (state) => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => new Response(JSON.stringify(
      String(url).endsWith("/vendors/me") ? { state } : session,
    ), { status: 200 })));
    const response = await middleware(request("/register/vendor", "__Host-eqourse-access=valid"));
    expect(response.status).toBe(state === "DRAFT" ? 200 : 307);
  });

  it("bounds every upstream middleware request", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: URL, options?: RequestInit) => {
      signals.push(options?.signal as AbortSignal);
      if (String(url).endsWith("/auth/session")) return JSON.stringify(options?.headers).includes("renewed")
        ? new Response(JSON.stringify(session), { status: 200 })
        : new Response(null, { status: 401 });
      if (String(url).endsWith("/auth/refresh")) return new Response(JSON.stringify({ accessToken: "renewed", refreshToken: "replacement" }), { status: 200 });
      if (String(url).endsWith("/vendors/me")) return new Response(null, { status: 404 });
      if (String(url).endsWith("/clients/me")) return new Response(null, { status: 404 });
      return new Response(JSON.stringify(session), { status: 200 });
    }));
    await middleware(request("/login", "__Host-eqourse-access=expired; __Host-eqourse-refresh=old-refresh"));
    expect(signals).toHaveLength(5);
    for (const signal of signals) expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("does not put a no-store header on anonymous marketing HTML", async () => {
    const response = await middleware(request("/about"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, max-age=0, must-revalidate");
  });

  it("keeps authenticated HTML uncacheable", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(session), { status: 200 })));
    const response = await middleware(request("/about", "__Host-eqourse-access=valid"));
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed with a branded page when the session API times out", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn(async (_url: URL, options?: RequestInit) => {
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      throw new DOMException("timed out", "AbortError");
    }));
    const response = await middleware(request("/", "__Host-eqourse-access=valid"));
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("eQOURSE+");
  });

  it("never renders a guest header when a rotation loses on another instance", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
    const response = await middleware(request("/about", "__Host-eqourse-access=expired; __Host-eqourse-refresh=old-refresh"));
    expect(response.status).toBe(503);
    expect(response.headers.get("x-middleware-request-x-eqourse-public-session")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("uses the shared verifier destination before rendering /login", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    const verifier = { ...session, roleAssignments: [{ role: "VERIFIER", businessUnit: "EQOURSE" }] };
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => String(url).endsWith("/me")
      ? new Response(null, { status: 404 })
      : new Response(JSON.stringify(verifier), { status: 200 })));
    const response = await middleware(request("/login", "__Host-eqourse-access=valid"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://plus.eqourse.test/company-reviews");
  });
});
