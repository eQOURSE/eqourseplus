import { registrationVerifySchema } from "@eqourse/shared";
import { NextRequest } from "next/server";

import {
  establishSession,
  readValidatedJson,
  validateUnsafeRequest,
} from "../../_lib/session-transport";

export async function POST(request: NextRequest) {
  const rejected = validateUnsafeRequest(request);
  if (rejected) return rejected;
  const body = await readValidatedJson(request, registrationVerifySchema);
  if (body instanceof Response) return body;
  return establishSession("/api/v1/auth/register/verify", body);
}
