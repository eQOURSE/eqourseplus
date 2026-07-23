import { randomUUID } from "node:crypto";

import { headers } from "next/headers";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("API path must be root-relative");
  }
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL is required");
  }

  const incomingRequestId = headers().get("x-request-id");
  const requestId =
    incomingRequestId && SAFE_REQUEST_ID.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set("x-request-id", requestId);

  return fetch(new URL(path, apiUrl), {
    ...init,
    headers: requestHeaders,
  });
}
