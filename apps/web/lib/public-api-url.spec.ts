import { afterEach, describe, expect, it, vi } from "vitest";

import { publicApiUrl } from "./public-api-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicApiUrl", () => {
  it("uses the configured browser-visible API origin without a duplicate slash", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", " https://api.eqourse.test/ ");

    expect(publicApiUrl("/api/v1/auth/otp/request")).toBe(
      "https://api.eqourse.test/api/v1/auth/otp/request",
    );
  });

  it("uses the local API origin when no public origin is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    expect(publicApiUrl("/api/v1/auth/register/request")).toBe(
      "http://localhost:4000/api/v1/auth/register/request",
    );
  });

  it("fails loudly in a deployed build when the public API origin is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    expect(() => publicApiUrl("/api/v1/auth/otp/request")).toThrow(
      "NEXT_PUBLIC_API_URL is required in deployed environments",
    );
  });
});
