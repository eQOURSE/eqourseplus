// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { init } = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("@sentry/nestjs", () => ({ init }));

describe("FR-FND-06 API Sentry environment", () => {
  beforeEach(() => {
    init.mockReset();
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SENTRY_ENVIRONMENT", "production");
    vi.stubEnv("SENTRY_DSN", "https://public-key@example.ingest.sentry.io/1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("marks API events as production events when deployed in production", async () => {
    await import("../src/instrument");

    expect(init).toHaveBeenCalledWith(expect.objectContaining({
      environment: "production",
    }));
  });
});
