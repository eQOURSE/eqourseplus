import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  errorResponse,
  validateUnsafeRequest,
} from "../app/api/auth/_lib/session-transport";
import { apiFetch } from "./api-fetch";

export async function proxyAuthenticatedApi(
  request: NextRequest,
  path: string,
  method: "GET" | "PATCH" | "POST",
): Promise<NextResponse> {
  if (method !== "GET") {
    const rejected = validateUnsafeRequest(request);
    if (rejected) return rejected;
  }

  const accessToken = cookies().get(ACCESS_COOKIE)?.value;
  if (!accessToken) return errorResponse(401);

  const headers = new Headers({
    Authorization: `Bearer ${accessToken}`,
  });
  if (request.headers.get("content-type")) {
    headers.set("Content-Type", request.headers.get("content-type")!);
  }

  const upstream = await apiFetch(path, {
    method,
    headers,
    ...(method === "GET" ? {} : { body: await request.arrayBuffer() }),
    cache: "no-store",
  });
  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}
