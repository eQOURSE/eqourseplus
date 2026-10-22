// @vitest-environment node

import type { Event, EventHint } from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

const { init } = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ init }));

describe("FR-FND-06 Edge event privacy", () => {
  it("removes SDK-added user identity before an event is sent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public-key@example.ingest.sentry.io/1");
    await import("./sentry.edge.config");

    const options = init.mock.calls[0]?.[0] as {
      sendDefaultPii: boolean;
      beforeSend: (event: Event, hint: EventHint) => Event | null;
    };
    expect(options.sendDefaultPii).toBe(false);

    const outgoing = options.beforeSend({
      message: "Public session resolution unavailable",
      user: { id: "visitor-id", email: "visitor@example.com", ip_address: "203.0.113.7", geo: { city: "Test City" } },
      tags: { reason: "upstream_status", route_group: "marketing" },
    } as Event, {} as EventHint);

    expect(outgoing).not.toHaveProperty("user");
    expect(outgoing?.tags).toEqual({ reason: "upstream_status", route_group: "marketing" });
  });
});
