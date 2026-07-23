import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers({ "x-request-id": "web-origin-456" })),
}));

import { apiFetch } from "./api-fetch";
import { middleware } from "../middleware";

describe("FR-FND-06 web request-id propagation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.API_URL;
  });

  it("preserves or creates an id on an inbound web request", () => {
    const incoming = new NextRequest("http://localhost/example", {
      headers: { "x-request-id": "browser-request-123" },
    });
    const preserved = middleware(incoming);
    expect(preserved.headers.get("x-request-id")).toBe("browser-request-123");

    const generated = middleware(
      new NextRequest("http://localhost/example"),
    );
    expect(generated.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("forwards the current web request id to the API", async () => {
    process.env.API_URL = "http://api.example.test";
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/health");

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(new Headers(init.headers).get("x-request-id")).toBe(
      "web-origin-456",
    );
  });
});
