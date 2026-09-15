import { NextRequest } from "next/server";

import { proxyAuthenticatedApi } from "../../../../../lib/authenticated-api";

export async function GET(request: NextRequest) {
  return proxyAuthenticatedApi(request, "/api/v1/vendors/me", "GET");
}

export async function PATCH(request: NextRequest) {
  return proxyAuthenticatedApi(request, "/api/v1/vendors/me", "PATCH");
}
