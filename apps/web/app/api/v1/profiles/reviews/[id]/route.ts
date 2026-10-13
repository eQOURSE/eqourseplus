import { NextRequest, NextResponse } from "next/server";

import { proxyAuthenticatedApi } from "../../../../../../lib/authenticated-api";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!/^[a-f\d]{24}$/i.test(params.id)) {
    return NextResponse.json({ message: "Invalid profile review route" }, { status: 400 });
  }
  return proxyAuthenticatedApi(request, `/api/v1/profiles/reviews/${params.id}`, "GET");
}
