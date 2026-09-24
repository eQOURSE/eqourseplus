import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiFlashLLMAdapter } from "../src/gemini-flash-llm.adapter";

afterEach(() => vi.unstubAllGlobals());

describe("offline Gemini Flash adapter", () => {
  it("requests structured JSON with the key in a header, then parses the response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"questions":[]}' }] } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new GeminiFlashLLMAdapter("test-key").generate({
      prompt: "Draft questions", schema: { type: "object" },
    });
    expect(result).toEqual({ questions: [] });
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("test-key");
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("x-goog-api-key")).toBe("test-key");
  });
});
