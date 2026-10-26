import { ClientState, VendorState, authSessionSchema, authTokenPairSchema, type AuthSession, type AuthTokenPair } from "@eqourse/shared";
import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePostSignInDestination } from "./lib/sign-in-destination";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./lib/auth-cookie-names";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;
const PUBLIC_SESSION_HEADER = "x-eqourse-public-session";
export const PUBLIC_ROUTES = [
  "/", "/freelancers", "/vendors", "/clients", "/about", "/jobs",
  "/login", "/register", "/register/freelancer", "/register/vendor", "/register/client",
] as const;
const publicRoutes = new Set<string>(PUBLIC_ROUTES);
const FETCH_TIMEOUT_MS = 4_000;
type RouteGroup = "marketing" | "login" | "register";
type UnavailableReason = "timeout" | "upstream_status" | "refresh_lost" | "parse_failed" | "misconfigured" | "upstream_unreachable";
type RefreshResult = { status: number; pair: AuthTokenPair | null; parseFailed: boolean };
const refreshFlights = new Map<string, Promise<RefreshResult>>();

class UnavailableError extends Error {
  constructor(readonly reason: UnavailableReason) {
    super(reason);
    this.name = "UnavailableError";
  }
}

function resolveRequestId(value: string | null): string {
  return value && SAFE_REQUEST_ID.test(value) ? value : crypto.randomUUID();
}

function publicRoute(pathname: string): boolean {
  return publicRoutes.has(pathname);
}

function routeGroup(pathname: string): RouteGroup {
  if (pathname === "/login") return "login";
  if (pathname === "/register" || pathname.startsWith("/register/")) return "register";
  return "marketing";
}

function apiUrl(path: string): URL {
  if (!process.env.API_URL) throw new UnavailableError("misconfigured");
  return new URL(path, process.env.API_URL);
}

function unavailableReason(error: unknown): UnavailableReason {
  if (error instanceof UnavailableError) return error.reason;
  if (error && typeof error === "object" && "name" in error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return "timeout";
  }
  return "upstream_unreachable";
}

async function sessionFor(accessToken: string, requestId: string): Promise<Response> {
  return fetch(apiUrl("/api/v1/auth/session"), {
    headers: { Authorization: `Bearer ${accessToken}`, "x-request-id": requestId },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

async function refreshOnce(refreshToken: string, requestId: string): Promise<RefreshResult> {
  const existing = refreshFlights.get(refreshToken);
  if (existing) return existing;
  const flight = (async (): Promise<RefreshResult> => {
    const response = await fetch(apiUrl("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-request-id": requestId },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return { status: response.status, pair: null, parseFailed: false };
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { status: response.status, pair: null, parseFailed: true };
    }
    const parsed = authTokenPairSchema.safeParse(body);
    return { status: response.status, pair: parsed.success ? parsed.data : null, parseFailed: !parsed.success };
  })();
  refreshFlights.set(refreshToken, flight);
  try {
    return await flight;
  } finally {
    if (refreshFlights.get(refreshToken) === flight) refreshFlights.delete(refreshToken);
  }
}

async function ownedCompanyState(actor: "client" | "vendor", accessToken: string, requestId: string): Promise<ClientState | VendorState | null> {
  const response = await fetch(apiUrl(`/api/v1/${actor}s/me`), {
    headers: { Authorization: `Bearer ${accessToken}`, "x-request-id": requestId },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new UnavailableError("upstream_status");
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new UnavailableError("parse_failed");
  }
  if (!body || typeof body !== "object" || !("state" in body) || typeof body.state !== "string") {
    throw new UnavailableError("parse_failed");
  }
  const states: readonly string[] = actor === "client" ? Object.values(ClientState) : Object.values(VendorState);
  if (!states.includes(body.state)) throw new UnavailableError("parse_failed");
  return body.state as ClientState | VendorState;
}

function unavailable(reason: UnavailableReason, group: RouteGroup): NextResponse {
  try {
    Sentry.withScope((scope) => {
      scope.clear();
      scope.setTag("reason", reason);
      scope.setTag("route_group", group);
      scope.setLevel("error");
      scope.setFingerprint(["public-session-unavailable"]);
      Sentry.captureMessage("Public session resolution unavailable");
    });
  } catch {
    // Reporting must never prevent the fail-closed response from being returned.
  }
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Temporarily unavailable | eQOURSE+</title></head><body style="margin:0;background:#F7FAF9;color:#232145;font-family:Inter,Arial,sans-serif;display:grid;min-height:100vh;place-items:center"><main style="max-width:36rem;padding:2rem"><p style="color:#0F9B8E;font-weight:700">eQOURSE+</p><h1>Temporarily unavailable</h1><p>We could not check your session. Please try again in a moment.</p><a href="/" style="color:#0F9B8E">Try again</a></main></body></html>`, {
    status: 503,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" },
  });
}

function finishResponse(
  response: NextResponse,
  requestId: string,
  rotated: { accessToken: string; refreshToken: string } | null,
  sessionBearing = true,
  clearStaleCookies = false,
): NextResponse {
  response.headers.set("x-request-id", requestId);
  response.headers.set("Cache-Control", sessionBearing ? "no-store" : "private, max-age=0, must-revalidate");
  if (rotated) {
    response.cookies.set(ACCESS_COOKIE, rotated.accessToken, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 15 * 60,
    });
    response.cookies.set(REFRESH_COOKIE, rotated.refreshToken, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60,
    });
  }
  if (clearStaleCookies) {
    response.cookies.set(ACCESS_COOKIE, "", {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0,
    });
    response.cookies.set(REFRESH_COOKIE, "", {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0,
    });
  }
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = resolveRequestId(request.headers.get("x-request-id"));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.delete(PUBLIC_SESSION_HEADER);
  const pathname = request.nextUrl.pathname;
  if (!publicRoute(pathname) || request.method !== "GET") {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const group = routeGroup(pathname);
  let rotated: { accessToken: string; refreshToken: string } | null = null;
  let clearStaleCookies = false;
  let session: AuthSession | null = null;
  try {
    let upstream = accessToken ? await sessionFor(accessToken, requestId) : null;
    if ((!upstream || upstream.status === 401) && refreshToken) {
      const refresh = await refreshOnce(refreshToken, requestId);
      if (refresh.pair) {
        rotated = refresh.pair;
        accessToken = rotated.accessToken;
        upstream = await sessionFor(accessToken, requestId);
      } else if (refresh.parseFailed) {
        return unavailable("parse_failed", group);
      } else if (refresh.status === 401) {
        if (pathname === "/login") {
          // A revoked refresh session is an expected signed-out state on the
          // page where the user can recover by requesting a new OTP. This
          // deliberately gives up the concurrent-rotation fail-closed guard
          // for /login only; marketing routes still protect a winning session.
          accessToken = undefined;
          clearStaleCookies = true;
        } else if (accessToken) {
          // A stale cookie may have lost a concurrent rotation on another instance.
          // Never render a guest header or clear a winning response's cookies.
          return unavailable("refresh_lost", group);
        }
      } else if (refresh.status !== 401) {
        return unavailable("upstream_status", group);
      }
    }
    if (upstream?.ok) {
      let body: unknown;
      try {
        body = await upstream.json();
      } catch {
        return unavailable("parse_failed", group);
      }
      const parsed = authSessionSchema.safeParse(body);
      if (!parsed.success) return unavailable("parse_failed", group);
      session = parsed.data;
    } else if (upstream && upstream.status !== 401) {
      return unavailable("upstream_status", group);
    }

    if (session && accessToken && pathname === "/login") {
      const vendor = await ownedCompanyState("vendor", accessToken, requestId);
      const client = vendor ? null : await ownedCompanyState("client", accessToken, requestId);
      const destination = resolvePostSignInDestination(session, Boolean(vendor), Boolean(client));
      return finishResponse(NextResponse.redirect(new URL(destination, request.url)), requestId, rotated);
    }
    if (session && accessToken && (pathname === "/register/client" || pathname === "/register/vendor")) {
      const actor = pathname.endsWith("client") ? "client" : "vendor";
      const state = await ownedCompanyState(actor, accessToken, requestId);
      const editable = actor === "client"
        ? state === ClientState.DRAFT || state === ClientState.MORE_INFO_NEEDED
        : state === VendorState.DRAFT || state === VendorState.MORE_INFO_NEEDED;
      if (state && !editable) {
        return finishResponse(NextResponse.redirect(new URL("/dashboard", request.url)), requestId, rotated);
      }
    }
  } catch (error) {
    return unavailable(unavailableReason(error), group);
  }

  if (session) requestHeaders.set(PUBLIC_SESSION_HEADER, JSON.stringify(session));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return finishResponse(response, requestId, rotated, Boolean(session || accessToken || refreshToken), clearStaleCookies);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
