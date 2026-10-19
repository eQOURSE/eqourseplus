import { ClientState, VendorState, authSessionSchema, authTokenPairSchema, type AuthSession } from "@eqourse/shared";
import { NextResponse, type NextRequest } from "next/server";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;
const ACCESS_COOKIE = "__Host-eqourse-access";
const REFRESH_COOKIE = "__Host-eqourse-refresh";
const PUBLIC_SESSION_HEADER = "x-eqourse-public-session";
const PUBLIC_ROUTES = new Set([
  "/", "/freelancers", "/vendors", "/clients", "/about", "/jobs",
  "/login", "/register", "/register/freelancer", "/register/vendor", "/register/client",
]);

function resolveRequestId(value: string | null): string {
  return value && SAFE_REQUEST_ID.test(value) ? value : crypto.randomUUID();
}

function publicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname);
}

function apiUrl(path: string): URL {
  if (!process.env.API_URL) throw new Error("API_URL is required");
  return new URL(path, process.env.API_URL);
}

async function sessionFor(accessToken: string, requestId: string): Promise<Response> {
  return fetch(apiUrl("/api/v1/auth/session"), {
    headers: { Authorization: `Bearer ${accessToken}`, "x-request-id": requestId },
    cache: "no-store",
  });
}

async function ownedCompanyState(actor: "client" | "vendor", accessToken: string, requestId: string): Promise<ClientState | VendorState | null> {
  const response = await fetch(apiUrl(`/api/v1/${actor}s/me`), {
    headers: { Authorization: `Bearer ${accessToken}`, "x-request-id": requestId },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Company status unavailable");
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("state" in body) || typeof body.state !== "string") {
    throw new Error("Invalid company status");
  }
  const states: readonly string[] = actor === "client" ? Object.values(ClientState) : Object.values(VendorState);
  if (!states.includes(body.state)) throw new Error("Invalid company status");
  return body.state as ClientState | VendorState;
}

function unavailable(): NextResponse {
  return new NextResponse("Session temporarily unavailable", {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

function finishResponse(response: NextResponse, requestId: string, rotated: { accessToken: string; refreshToken: string } | null): NextResponse {
  response.headers.set("x-request-id", requestId);
  response.headers.set("Cache-Control", "no-store");
  if (rotated) {
    response.cookies.set(ACCESS_COOKIE, rotated.accessToken, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 15 * 60,
    });
    response.cookies.set(REFRESH_COOKIE, rotated.refreshToken, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60,
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
  let rotated: { accessToken: string; refreshToken: string } | null = null;
  let session: AuthSession | null = null;
  try {
    let upstream = accessToken ? await sessionFor(accessToken, requestId) : null;
    if ((!upstream || upstream.status === 401) && refreshToken) {
      const refresh = await fetch(apiUrl("/api/v1/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-id": requestId },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (refresh.ok) {
        const parsed = authTokenPairSchema.safeParse(await refresh.json());
        if (!parsed.success) return unavailable();
        rotated = parsed.data;
        accessToken = rotated.accessToken;
        upstream = await sessionFor(accessToken, requestId);
      } else if (refresh.status !== 401) {
        return unavailable();
      }
    }
    if (upstream?.ok) {
      const parsed = authSessionSchema.safeParse(await upstream.json());
      if (!parsed.success) return unavailable();
      session = parsed.data;
    } else if (upstream && upstream.status !== 401) {
      return unavailable();
    }

    if (session && accessToken && pathname === "/login") {
      const vendor = await ownedCompanyState("vendor", accessToken, requestId);
      const client = vendor ? null : await ownedCompanyState("client", accessToken, requestId);
      const internal = session.roleAssignments.some((assignment) => assignment.role === "VERIFIER");
      const destination = vendor || client ? "/dashboard" : internal ? "/company-reviews" : "/dashboard";
      return finishResponse(NextResponse.redirect(new URL(destination, request.url)), requestId, rotated);
    }
    if (session && accessToken && (pathname === "/register/client" || pathname === "/register/vendor")) {
      const actor = pathname.endsWith("client") ? "client" : "vendor";
      const state = await ownedCompanyState(actor, accessToken, requestId);
      if (state && state !== ClientState.DRAFT && state !== ClientState.MORE_INFO_NEEDED) {
        return finishResponse(NextResponse.redirect(new URL("/dashboard", request.url)), requestId, rotated);
      }
    }
  } catch {
    return unavailable();
  }

  if (session) requestHeaders.set(PUBLIC_SESSION_HEADER, JSON.stringify(session));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return finishResponse(response, requestId, rotated);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
