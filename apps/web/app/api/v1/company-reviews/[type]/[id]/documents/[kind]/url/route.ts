import { NextRequest, NextResponse } from "next/server";

import { proxyAuthenticatedApi } from "../../../../../../../../../lib/authenticated-api";

interface RouteContext {
  params: { type: string; id: string; kind: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { type, id, kind } = params;
  if (!validType(type) || !/^[a-f\d]{24}$/i.test(id) || !/^[a-z0-9-]+$/i.test(kind)) {
    return NextResponse.json({ message: "Invalid company document route" }, { status: 400 });
  }
  return proxyAuthenticatedApi(
    request,
    `/api/v1/company-reviews/${type}/${id}/documents/${kind}/url`,
    "GET",
  );
}

function validType(type: string): type is "vendors" | "clients" {
  return type === "vendors" || type === "clients";
}
