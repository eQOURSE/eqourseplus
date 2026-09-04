// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

describe("FR-REG-02A middleware header preservation", () => {
  it("preserves Origin and Fetch Metadata while adding x-request-id for Route Handlers", () => {
    const response = middleware(
      new NextRequest("https://plus.eqourse.test/api/auth/refresh", {
        method: "POST",
        headers: {
          origin: "https://plus.eqourse.test",
          "sec-fetch-site": "same-origin",
        },
      }),
    );

    expect(response.headers.get("x-middleware-request-origin")).toBe(
      "https://plus.eqourse.test",
    );
    expect(response.headers.get("x-middleware-request-sec-fetch-site")).toBe(
      "same-origin",
    );
    expect(response.headers.get("x-middleware-request-x-request-id")).toMatch(
      /^[A-Za-z0-9._-]{1,128}$/,
    );
  });
});
