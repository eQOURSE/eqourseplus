// @vitest-environment node

import { NextRequest } from "next/server";
import { readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { middleware, PUBLIC_ROUTES } from "./middleware";

const PUBLIC_HEADER_ROUTES = [
  "/", "/about", "/clients", "/freelancers", "/jobs", "/login",
  "/register", "/register/client", "/register/freelancer", "/register/vendor", "/vendors",
] as const;

describe("FR-REG-02A middleware header preservation", () => {
  it("preserves Origin and Fetch Metadata while adding x-request-id for Route Handlers", async () => {
    const response = await middleware(
      new NextRequest("https://plus.eqourse.test/api/auth/refresh", {
        method: "POST",
        headers: {
          origin: "https://plus.eqourse.test",
          "sec-fetch-site": "same-origin",
        },
      }),
    );

    expect(response.headers.get("x-middleware-request-origin")).toBe(
      "https://plus.eqourse.test",
    );
    expect(response.headers.get("x-middleware-request-sec-fetch-site")).toBe(
      "same-origin",
    );
    expect(response.headers.get("x-middleware-request-x-request-id")).toMatch(
      /^[A-Za-z0-9._-]{1,128}$/,
    );
  });
});

describe("FR-REG-02D public session before HTML", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("covers every public page that renders the shared header", () => {
    const appDir = resolve(process.cwd(), "app");
    const pages: string[] = [];
    function visit(dir: string): void {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) visit(path);
        else if (entry.name === "page.tsx") {
          const parent = relative(appDir, dir).split(sep).join("/");
          if (parent.startsWith("(authenticated)/") || parent === "jobs/[slug]" || parent === "design-system") continue;
          pages.push(parent ? `/${parent}` : "/");
        }
      }
    }
    visit(appDir);
    expect(pages.sort()).toEqual([...PUBLIC_HEADER_ROUTES]);
    expect([...PUBLIC_ROUTES].sort()).toEqual([...PUBLIC_HEADER_ROUTES]);
  });

  it.each(PUBLIC_HEADER_ROUTES.filter((path) => path !== "/login"))(
    "passes the authenticated session to server rendering on %s",
    async (path) => {
      vi.stubEnv("API_URL", "https://api.eqourse.test");
      const fetchMock = vi.fn().mockImplementation((url: URL) => Promise.resolve(
        String(url).endsWith("/me")
          ? new Response(null, { status: 404 })
          : new Response(JSON.stringify({
            userId: "507f1f77bcf86cd799439011",
            email: "owner@example.com",
            roleAssignments: [],
            profileState: "DRAFT",
          }), { status: 200 }),
      ));
      vi.stubGlobal("fetch", fetchMock);
      const request = new NextRequest(`https://plus.eqourse.test${path}`, {
        headers: { cookie: "__Host-eqourse-access=valid-access" },
      });

      const response = await middleware(request);

      expect(response.headers.get("x-middleware-request-x-eqourse-public-session"), path)
        .toContain("owner@example.com");
      expect(fetchMock, path).toHaveBeenCalled();
    },
  );

  it.each(PUBLIC_HEADER_ROUTES)("serves a guest header on %s when no session cookie exists", async (path) => {
    const response = await middleware(new NextRequest(`https://plus.eqourse.test${path}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-eqourse-public-session")).toBeNull();
  });

  it("rotates an expired access session before serving public HTML", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "new-access", refreshToken: "new-refresh" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        userId: "507f1f77bcf86cd799439011",
        email: "owner@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await middleware(new NextRequest("https://plus.eqourse.test/about", {
      headers: { cookie: "__Host-eqourse-access=expired; __Host-eqourse-refresh=valid-refresh" },
    }));
    expect(response.headers.get("x-middleware-request-x-eqourse-public-session"))
      .toContain("owner@example.com");
    expect(response.headers.get("set-cookie")).toContain("new-access");
  });

  it("redirects a signed-in account from /login before serving its form", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: URL) => Promise.resolve(
      String(url).endsWith("/me")
        ? new Response(null, { status: 404 })
        : new Response(JSON.stringify({ userId: "507f1f77bcf86cd799439011", email: "owner@example.com", roleAssignments: [], profileState: "DRAFT" }), { status: 200 }),
    )));
    const response = await middleware(new NextRequest("https://plus.eqourse.test/login", {
      headers: { cookie: "__Host-eqourse-access=valid-access" },
    }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://plus.eqourse.test/dashboard");
  });

  it.each(["SUBMITTED", "UNDER_REVIEW", "APPROVED"])(
    "sends a %s client owner to the dashboard without registration HTML",
    async (state) => {
      vi.stubEnv("API_URL", "https://api.eqourse.test");
      vi.stubGlobal("fetch", vi.fn().mockImplementation((url: URL) => Promise.resolve(
        String(url).endsWith("/clients/me")
          ? new Response(JSON.stringify({ state }), { status: 200 })
          : new Response(JSON.stringify({ userId: "507f1f77bcf86cd799439011", email: "owner@example.com", roleAssignments: [], profileState: "DRAFT" }), { status: 200 }),
      )));
      const response = await middleware(new NextRequest("https://plus.eqourse.test/register/client", {
        headers: { cookie: "__Host-eqourse-access=valid-access" },
      }));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://plus.eqourse.test/dashboard");
    },
  );

  it("keeps an incomplete client draft on the registration route", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: URL) => Promise.resolve(
      String(url).endsWith("/clients/me")
        ? new Response(JSON.stringify({ state: "DRAFT" }), { status: 200 })
        : new Response(JSON.stringify({ userId: "507f1f77bcf86cd799439011", email: "owner@example.com", roleAssignments: [], profileState: "DRAFT" }), { status: 200 }),
    )));
    const response = await middleware(new NextRequest("https://plus.eqourse.test/register/client", {
      headers: { cookie: "__Host-eqourse-access=valid-access" },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-eqourse-public-session"))
      .toContain("owner@example.com");
  });

  it("ignores a client-supplied session header when no session cookie exists", async () => {
    const response = await middleware(new NextRequest("https://plus.eqourse.test/clients", {
      headers: { "x-eqourse-public-session": JSON.stringify({ email: "forged@example.com" }) },
    }));
    expect(response.headers.get("x-middleware-request-x-eqourse-public-session")).toBeNull();
  });

  it("keeps rotated cookies on an immediate signed-in redirect", async () => {
    vi.stubEnv("API_URL", "https://api.eqourse.test");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "new-access", refreshToken: "new-refresh" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ userId: "507f1f77bcf86cd799439011", email: "owner@example.com", roleAssignments: [], profileState: "DRAFT" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await middleware(new NextRequest("https://plus.eqourse.test/login", {
      headers: { cookie: "__Host-eqourse-access=expired; __Host-eqourse-refresh=valid-refresh" },
    }));
    expect(response.status).toBe(307);
    expect(response.headers.get("set-cookie")).toContain("new-access");
    expect(response.headers.get("set-cookie")).toContain("new-refresh");
  });
});
