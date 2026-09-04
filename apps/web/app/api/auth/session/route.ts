import { NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  errorResponse,
  readSession,
  rotateSession,
  sessionResponse,
} from "../_lib/session-transport";

export async function GET(request: NextRequest) {
  const current = await readSession(
    request.cookies.get(ACCESS_COOKIE)?.value,
  );
  if (current.status !== 401) return sessionResponse(current);

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return errorResponse(401);
  const rotated = await rotateSession(refreshToken);
  if ("response" in rotated) return errorResponse(401);

  const retried = await readSession(rotated.pair.accessToken);
  return sessionResponse(retried, rotated.pair);
}
