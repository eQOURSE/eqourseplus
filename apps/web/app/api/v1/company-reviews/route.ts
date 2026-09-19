import { type NextRequest } from "next/server";

import { proxyAuthenticatedApi } from "../../../../lib/authenticated-api";

export async function GET(request: NextRequest) {
  return proxyAuthenticatedApi(request, "/api/v1/company-reviews", "GET");
}
