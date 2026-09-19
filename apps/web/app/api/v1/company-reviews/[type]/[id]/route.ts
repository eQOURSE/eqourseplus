import { NextRequest, NextResponse } from "next/server";

import { proxyAuthenticatedApi } from "../../../../../../lib/authenticated-api";

interface RouteContext {
  params: { type: string; id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { type, id } = params;
  if (!validType(type) || !validId(id)) {
    return NextResponse.json({ message: "Invalid company review route" }, { status: 400 });
  }
  return proxyAuthenticatedApi(request, `/api/v1/company-reviews/${type}/${id}`, "GET");
}

function validType(type: string): type is "vendors" | "clients" {
  return type === "vendors" || type === "clients";
}

function validId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}
