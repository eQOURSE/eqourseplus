import { NextRequest, NextResponse } from "next/server";

import { proxyAuthenticatedApi } from "../../../../../../../lib/authenticated-api";

interface RouteContext {
  params: { type: string; id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { type, id } = params;
  if (!validType(type) || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ message: "Invalid company decision route" }, { status: 400 });
  }
  return proxyAuthenticatedApi(
    request,
    `/api/v1/company-reviews/${type}/${id}/decisions`,
    "POST",
  );
}

function validType(type: string): type is "vendors" | "clients" {
  return type === "vendors" || type === "clients";
}
