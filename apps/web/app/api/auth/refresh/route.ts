import { NextRequest } from "next/server";

import {
  REFRESH_COOKIE,
  authenticatedResponse,
  errorResponse,
  rotateSession,
  validateUnsafeRequest,
} from "../_lib/session-transport";

export async function POST(request: NextRequest) {
  const rejected = validateUnsafeRequest(request);
  if (rejected) return rejected;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return errorResponse(401);

  const rotated = await rotateSession(refreshToken);
  return "response" in rotated
    ? rotated.response
    : authenticatedResponse(rotated.pair);
}
