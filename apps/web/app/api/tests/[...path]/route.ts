import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "../../../../lib/api-fetch";
import {
  ACCESS_COOKIE, REFRESH_COOKIE, errorResponse, rotateSession,
  setSessionCookies, validateUnsafeRequest,
} from "../../auth/_lib/session-transport";

interface Context { params: { path: string[] } }

async function forward(request: NextRequest, context: Context, method: "GET" | "POST" | "PUT") {
  if (method !== "GET") {
    const rejection = validateUnsafeRequest(request);
    if (rejection) return rejection;
  }
  if (!context.params.path.length || context.params.path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part))) {
    return errorResponse(400);
  }
  const path = `/api/v1/tests/${context.params.path.join("/")}`;
  const body = method === "GET" ? undefined : await request.text();
  const call = (token: string | undefined) => apiFetch(path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body,
    cache: "no-store",
  });
  let upstream = await call(request.cookies.get(ACCESS_COOKIE)?.value);
  let pair;
  if (upstream.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) return errorResponse(401);
    const rotated = await rotateSession(refreshToken);
    if ("response" in rotated) return errorResponse(401);
    pair = rotated.pair;
    upstream = await call(pair.accessToken);
  }
  const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
    status: upstream.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
  if (pair) setSessionCookies(response, pair);
  return response;
}

export function GET(request: NextRequest, context: Context) { return forward(request, context, "GET"); }
export function POST(request: NextRequest, context: Context) { return forward(request, context, "POST"); }
export function PUT(request: NextRequest, context: Context) { return forward(request, context, "PUT"); }
