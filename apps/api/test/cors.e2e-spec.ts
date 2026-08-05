import { describe, expect, it } from "vitest";

import { loadCorsOptions } from "../src/cors.config";

describe("API CORS configuration", () => {
  it("loads an exact comma-separated origin allowlist", () => {
    expect(
      loadCorsOptions({
        NODE_ENV: "production",
        CORS_ORIGINS:
          "https://plus.eqourse.com, https://eqourse-preview.vercel.app",
      }),
    ).toEqual({
      origin: [
        "https://plus.eqourse.com",
        "https://eqourse-preview.vercel.app",
      ],
      credentials: false,
    });
  });

  it.each([
    "*",
    "https://plus.eqourse.com/register",
    "https://plus.eqourse.com?preview=true",
    "https://plus.eqourse.com#register",
  ])("rejects a non-origin CORS value: %s", (value) => {
    expect(() =>
      loadCorsOptions({ NODE_ENV: "production", CORS_ORIGINS: value }),
    ).toThrow("CORS_ORIGINS");
  });

  it("requires configured origins in production", () => {
    expect(() => loadCorsOptions({ NODE_ENV: "production" })).toThrow(
      "CORS_ORIGINS",
    );
  });

  it("uses the localhost web origin only for local development", () => {
    expect(loadCorsOptions({ NODE_ENV: "development" })).toEqual({
      origin: ["http://localhost:3000"],
      credentials: false,
    });
  });
});
