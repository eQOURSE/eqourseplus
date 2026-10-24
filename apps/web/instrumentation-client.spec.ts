// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { init, captureRouterTransitionStart } = vi.hoisted(() => ({
  init: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({ init, captureRouterTransitionStart }));

describe("FR-FND-06 client Sentry environment", () => {
  beforeEach(() => {
    init.mockReset();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public-key@example.ingest.sentry.io/1");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
  });

  it("uses the client-inlined Vercel environment instead of server-only variables", async () => {
    await import("./instrumentation-client");

    expect(init).toHaveBeenCalledWith(expect.objectContaining({
      environment: "preview",
    }));
  });
});
