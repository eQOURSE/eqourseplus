// @vitest-environment node

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as registerVerify } from "./register/verify/route";
import { POST as otpVerify } from "./otp/verify/route";
import { POST as refresh } from "./refresh/route";
import { POST as logout } from "./logout/route";
import { GET as session } from "./session/route";

vi.mock("next/headers", () => ({
  headers: () => new Headers({ "x-request-id": "web-route-test" }),
}));

const fetchMock = vi.fn<typeof fetch>();
const appOrigin = "https://plus.eqourse.test";
const accessToken = "secret-access-token";
const refreshToken = "secret-refresh-token";
const rotatedAccessToken = "rotated-access-token";
const rotatedRefreshToken = "rotated-refresh-token";

function request(
  path: string,
  init: RequestInit = {},
  cookies: Record<string, string> = {},
): NextRequest {
  const headers = new Headers(init.headers);
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`${appOrigin}${path}`, { ...init, headers });
}

function unsafeHeaders(
  origin = appOrigin,
  fetchSite: string | undefined = "same-origin",
): HeadersInit {
  return {
    "content-type": "application/json",
    origin,
    ...(fetchSite ? { "sec-fetch-site": fetchSite } : {}),
  };
}

function upstreamJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setCookie(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}

beforeEach(() => {
  vi.stubEnv("APP_URL", appOrigin);
  vi.stubEnv("API_URL", "https://api.eqourse.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("FR-REG-02A same-origin session transport", () => {
  it("sets host-only httpOnly cookies with lifetimes shared with API token issuance", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamJson({ accessToken, refreshToken }),
    );

    const response = await otpVerify(
      request("/api/auth/otp/verify", {
        method: "POST",
        headers: unsafeHeaders(),
        body: JSON.stringify({ email: "person@example.com", otp: "123456" }),
      }),
    );
    const cookies = setCookie(response);

    expect(response.status).toBe(200);
    expect(cookies).toContain("__Host-eqourse-access=");
    expect(cookies).toContain("__Host-eqourse-refresh=");
    expect(cookies).toMatch(/HttpOnly/i);
    expect(cookies).toMatch(/Secure/i);
    expect(cookies).toMatch(/SameSite=lax/i);
    expect(cookies).toMatch(/Path=\//i);
    expect(cookies).toContain("Max-Age=900");
    expect(cookies).toContain("Max-Age=2592000");
    expect(cookies).not.toMatch(/Domain=/i);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "authenticated" });
  });

  it("refreshes an expired access token once, retries session once, and installs the rotated pair", async () => {
    fetchMock
      .mockResolvedValueOnce(upstreamJson({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(
        upstreamJson({
          accessToken: rotatedAccessToken,
          refreshToken: rotatedRefreshToken,
        }),
      )
      .mockResolvedValueOnce(
        upstreamJson({
          userId: "user-1",
          email: "person@example.com",
          roleAssignments: [],
          profileState: "DRAFT",
        }),
      );

    const response = await session(
      request("/api/auth/session", {}, {
        "__Host-eqourse-access": accessToken,
        "__Host-eqourse-refresh": refreshToken,
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://api.eqourse.test/api/v1/auth/session",
    );
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("x-request-id"),
    ).toBe("web-route-test");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://api.eqourse.test/api/v1/auth/refresh",
    );
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
      "https://api.eqourse.test/api/v1/auth/session",
    );
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ refreshToken }),
    );
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get("authorization"))
      .toBe(`Bearer ${rotatedAccessToken}`);
    expect(setCookie(response)).toContain(
      `__Host-eqourse-access=${rotatedAccessToken}`,
    );
    expect(setCookie(response)).toContain(
      `__Host-eqourse-refresh=${rotatedRefreshToken}`,
    );
    expect(await response.json()).toEqual({
      userId: "user-1",
      email: "person@example.com",
      roleAssignments: [],
      profileState: "DRAFT",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("makes one refresh attempt for permanently invalid credentials and leaves cookies untouched", async () => {
    fetchMock
      .mockResolvedValueOnce(upstreamJson({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(upstreamJson({ message: "Unauthorized" }, 401));

    const response = await session(
      request("/api/auth/session", {}, {
        "__Host-eqourse-access": accessToken,
        "__Host-eqourse-refresh": "invalid-refresh",
      }),
    );

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(setCookie(response)).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not clear a winning tab's rotated cookies after a concurrent refresh loses", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamJson({ message: "Unauthorized" }, 401),
    );
    const losingResponse = await refresh(
      request(
        "/api/auth/refresh",
        { method: "POST", headers: unsafeHeaders() },
        { "__Host-eqourse-refresh": refreshToken },
      ),
    );
    expect(losingResponse.status).toBe(401);
    expect(setCookie(losingResponse)).toBe("");

    fetchMock.mockResolvedValueOnce(
      upstreamJson({
        userId: "user-1",
        email: "person@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
      }),
    );
    const subsequentResponse = await session(
      request("/api/auth/session", {}, {
        "__Host-eqourse-access": rotatedAccessToken,
        "__Host-eqourse-refresh": rotatedRefreshToken,
      }),
    );

    expect(subsequentResponse.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("authorization"),
    ).toBe(`Bearer ${rotatedAccessToken}`);
  });

  it.each([
    ["an unrelated cross-site origin", "https://attacker.example", "cross-site"],
    ["an untrusted same-site sibling", "https://www.eqourse.test", "same-site"],
  ])("rejects %s", async (_label, origin, fetchSite) => {
    const response = await otpVerify(
      request("/api/auth/otp/verify", {
        method: "POST",
        headers: unsafeHeaders(origin, fetchSite),
        body: JSON.stringify({ email: "person@example.com", otp: "123456" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an unsafe request without Origin", async () => {
    const response = await otpVerify(
      request("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com", otp: "123456" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a valid Origin when Sec-Fetch-Site is absent", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamJson({ accessToken, refreshToken }),
    );
    const response = await otpVerify(
      request("/api/auth/otp/verify", {
        method: "POST",
        headers: unsafeHeaders(appOrigin, undefined),
        body: JSON.stringify({ email: "person@example.com", otp: "123456" }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rejects same-origin requests whose Fetch Metadata says same-site or cross-site", async () => {
    for (const fetchSite of ["same-site", "cross-site"]) {
      const response = await otpVerify(
        request("/api/auth/otp/verify", {
          method: "POST",
          headers: unsafeHeaders(appOrigin, fetchSite),
          body: JSON.stringify({ email: "person@example.com", otp: "123456" }),
        }),
      );
      expect(response.status).toBe(403);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("consumes registration and sign-in token pairs without exposing them in responses or logs", async () => {
    const consoleSpies = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];
    fetchMock
      .mockResolvedValueOnce(upstreamJson({ accessToken, refreshToken }))
      .mockResolvedValueOnce(upstreamJson({ accessToken, refreshToken }));

    const registrationResponse = await registerVerify(
      request("/api/auth/register/verify", {
        method: "POST",
        headers: unsafeHeaders(),
        body: JSON.stringify({
          email: "person@example.com",
          phone: "+14155552671",
          emailOtp: "123456",
          phoneOtp: "654321",
        }),
      }),
    );
    const signInResponse = await otpVerify(
      request("/api/auth/otp/verify", {
        method: "POST",
        headers: unsafeHeaders(),
        body: JSON.stringify({ email: "person@example.com", otp: "123456" }),
      }),
    );

    for (const response of [registrationResponse, signInResponse]) {
      const body = await response.text();
      expect(body).not.toContain(accessToken);
      expect(body).not.toContain(refreshToken);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(consoleSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  it("does not relay the API's deliberately hidden registration-conflict detail", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamJson(
        {
          code: "REGISTRATION_CONFLICT",
          message: "phone and PAN already exist",
        },
        409,
      ),
    );
    const response = await registerVerify(
      request("/api/auth/register/verify", {
        method: "POST",
        headers: unsafeHeaders(),
        body: JSON.stringify({
          email: "person@example.com",
          phone: "+14155552671",
          emailOtp: "123456",
          phoneOtp: "654321",
        }),
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(409);
    expect(body).not.toMatch(/phone|pan|already/i);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed instead of leaking unexpected fields from a session response", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamJson({
        userId: "user-1",
        email: "person@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
        accessToken,
      }),
    );

    const response = await session(
      request("/api/auth/session", {}, {
        "__Host-eqourse-access": accessToken,
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).not.toContain(accessToken);
    expect(body).not.toContain("accessToken");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("clears both cookies only after forwarding explicit sign-out for server-side revocation", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await logout(
      request(
        "/api/auth/logout",
        { method: "POST", headers: unsafeHeaders() },
        { "__Host-eqourse-refresh": refreshToken },
      ),
    );

    expect(response.status).toBe(204);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ refreshToken }),
    );
    expect(setCookie(response)).toContain("__Host-eqourse-access=");
    expect(setCookie(response)).toContain("__Host-eqourse-refresh=");
    expect(setCookie(response)).toContain("Max-Age=0");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
