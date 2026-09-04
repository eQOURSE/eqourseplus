import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  authSessionSchema,
  authTokenPairSchema,
  type AuthSession,
  type AuthTokenPair,
} from "@eqourse/shared";
import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "../../../../lib/api-fetch";

interface Schema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false };
}

export const ACCESS_COOKIE = "__Host-eqourse-access";
export const REFRESH_COOKIE = "__Host-eqourse-refresh";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const COOKIE_BASE = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export function validateUnsafeRequest(
  request: NextRequest,
): NextResponse | null {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    return errorResponse(500);
  }

  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(appUrl).origin;
  } catch {
    return errorResponse(500);
  }

  if (request.headers.get("origin") !== allowedOrigin) {
    return errorResponse(403);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || fetchSite === "same-site") {
    return errorResponse(403);
  }

  return null;
}

export async function readValidatedJson<T>(
  request: NextRequest,
  schema: Schema<T>,
): Promise<T | NextResponse> {
  try {
    const parsed = schema.safeParse(await request.json());
    return parsed.success ? parsed.data : errorResponse(400);
  } catch {
    return errorResponse(400);
  }
}

export async function establishSession(
  path: string,
  body: unknown,
): Promise<NextResponse> {
  const upstream = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!upstream.ok) return errorResponse(upstream.status);

  const pair = await parseUpstream(upstream, authTokenPairSchema);
  if (!pair) return errorResponse(502);

  const response = NextResponse.json(
    { status: "authenticated" },
    { status: 200, headers: NO_STORE_HEADERS },
  );
  setSessionCookies(response, pair);
  return response;
}

export async function rotateSession(
  refreshToken: string,
): Promise<{ pair: AuthTokenPair } | { response: NextResponse }> {
  const upstream = await apiFetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!upstream.ok) {
    return { response: errorResponse(upstream.status) };
  }

  const pair = await parseUpstream(upstream, authTokenPairSchema);
  return pair ? { pair } : { response: errorResponse(502) };
}

export async function readSession(
  accessToken: string | undefined,
): Promise<Response> {
  return apiFetch("/api/v1/auth/session", {
    method: "GET",
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    cache: "no-store",
  });
}

export async function sessionResponse(
  upstream: Response,
  pair?: AuthTokenPair,
): Promise<NextResponse> {
  if (!upstream.ok) {
    const response = errorResponse(upstream.status);
    if (pair) setSessionCookies(response, pair);
    return response;
  }

  const session = await parseUpstream(upstream, authSessionSchema);
  if (!session) return errorResponse(502);
  const response = NextResponse.json(session satisfies AuthSession, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
  if (pair) setSessionCookies(response, pair);
  return response;
}

export function authenticatedResponse(pair: AuthTokenPair): NextResponse {
  const response = NextResponse.json(
    { status: "authenticated" },
    { status: 200, headers: NO_STORE_HEADERS },
  );
  setSessionCookies(response, pair);
  return response;
}

export function errorResponse(status: number): NextResponse {
  return NextResponse.json(
    { status: status === 401 ? "unauthorized" : "error" },
    { status, headers: NO_STORE_HEADERS },
  );
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", {
    ...COOKIE_BASE,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    ...COOKIE_BASE,
    maxAge: 0,
  });
}

function setSessionCookies(
  response: NextResponse,
  pair: AuthTokenPair,
): void {
  response.cookies.set(ACCESS_COOKIE, pair.accessToken, {
    ...COOKIE_BASE,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE, pair.refreshToken, {
    ...COOKIE_BASE,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

async function parseUpstream<T>(
  response: Response,
  schema: Schema<T>,
): Promise<T | null> {
  try {
    const parsed = schema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
