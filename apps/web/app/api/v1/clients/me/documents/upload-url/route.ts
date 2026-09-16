import { NextRequest } from "next/server";

import { proxyAuthenticatedApi } from "../../../../../../../lib/authenticated-api";

export async function POST(request: NextRequest) {
  return proxyAuthenticatedApi(
    request,
    "/api/v1/clients/me/documents/upload-url",
    "POST",
  );
}
