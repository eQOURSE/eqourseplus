import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VerifierTests } from "./verifier-tests";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => cleanup());

describe("FR-TST-02-lite verifier view", () => {
  it("lists flagged attempts for review", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{
      id: "507f1f77bcf86cd799439011", userId: "507f191e810c19729de860ea",
      taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
      startedAt: "2026-09-24T10:00:00Z", scorePercent: 80, violationCount: 2,
    }]), { status: 200 }));
    render(<VerifierTests />);
    expect(await screen.findByText(/2 integrity events/i)).toBeInTheDocument();
  });
});
