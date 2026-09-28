import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("shows the guideline acknowledgement in the attempt report", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{
      id: "507f1f77bcf86cd799439011", userId: "507f191e810c19729de860ea",
      taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
      startedAt: "2026-09-24T10:00:00Z", scorePercent: 80, violationCount: 1,
    }]), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      id: "507f1f77bcf86cd799439011", taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
      status: "UNDER_REVIEW", startedAt: "2026-09-24T10:00:00Z", scorePercent: 80,
      guidelineAcknowledgement: {
        title: "Bounding box rules", body: "Include worn backpacks in pedestrian boxes.",
        digest: "a".repeat(64), acknowledgedAt: "2026-09-24T10:00:00Z",
      },
      violations: [{ kind: "TAB_SWITCH", occurredAt: "2026-09-24T10:05:00Z" }],
    }), { status: 200 }));
    render(<VerifierTests />);
    fireEvent.click(await screen.findByRole("button", { name: /1 integrity event/i }));
    expect(await screen.findByText("Bounding box rules")).toBeInTheDocument();
    expect(screen.getByText("Include worn backpacks in pedestrian boxes.")).toBeInTheDocument();
    expect(screen.getByText(/acknowledged/i)).toBeInTheDocument();
  });
});
