import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "../../../../lib/api-fetch";

import {
  REFRESH_COOKIE,
  clearSessionCookies,
  errorResponse,
  validateUnsafeRequest,
} from "../_lib/session-transport";

export async function POST(request: NextRequest) {
  const rejected = validateUnsafeRequest(request);
  if (rejected) return rejected;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
    clearSessionCookies(response);
    return response;
  }

  const upstream = await apiFetch("/api/v1/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!upstream.ok && upstream.status !== 401) {
    return errorResponse(upstream.status);
  }

  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  clearSessionCookies(response);
  return response;
}
