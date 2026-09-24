import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestCenter } from "./test-center";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => cleanup());

describe("FR-TST-01/05 test center", () => {
  it("shows a configured category, remaining attempts, and the cooldown", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{
      taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
      title: "Bounding Box", serviceLine: "AI Data Services", questionCount: 10,
      timeLimitSeconds: 900,
      eligibility: { remainingAttempts: 1, canStart: false, cooldownExpiry: "2026-10-08T10:00:00Z" },
    }]), { status: 200 }));
    render(<TestCenter />);
    expect(await screen.findByText("Bounding Box")).toBeInTheDocument();
    expect(screen.getByText(/1 attempt remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Available after/i)).toBeInTheDocument();
  });

  it("uses full-screen before starting and keeps answer keys out of the UI", async () => {
    const fullScreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: fullScreen });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
        title: "Bounding Box", serviceLine: "AI Data Services", questionCount: 1,
        timeLimitSeconds: 900,
        eligibility: { remainingAttempts: 2, canStart: true, cooldownExpiry: null },
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "507f1f77bcf86cd799439011", status: "IN_PROGRESS", taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
        startedAt: "2026-09-24T10:00:00Z", expiresAt: "2026-09-24T10:15:00Z",
        serverNow: "2026-09-24T10:00:00Z",
        items: [{ questionId: "q1", prompt: "Identify the correct box.", options: [
          { id: "a", text: "Tight fit" }, { id: "b", text: "Loose fit" },
        ] }], violations: [],
      }), { status: 201 }));
    render(<TestCenter />);
    const button = await screen.findByRole("button", { name: /start test/i });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    await waitFor(() => expect(fullScreen).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Identify the correct box.")).toBeInTheDocument();
    expect(screen.queryByText(/correctOptionId/)).not.toBeInTheDocument();
  });

  it("resumes at the last unanswered question after a reload", async () => {
    const id = "507f1f77bcf86cd799439012";
    window.history.replaceState({}, "", `/tests?attempt=${id}`);
    window.sessionStorage.setItem(`assessment-progress:${id}`, JSON.stringify({ position: 1, answers: { q1: "a" } }));
    fetchMock.mockImplementation(async (url) => new Response(JSON.stringify(
      String(url).endsWith("/catalog") ? [] : {
        id, status: "IN_PROGRESS", taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box",
        expiresAt: "2026-09-24T10:15:00Z", serverNow: "2026-09-24T10:00:00Z",
        items: [
          { questionId: "q1", prompt: "First question", options: [{ id: "a", text: "A" }] },
          { questionId: "q2", prompt: "Second question", options: [{ id: "b", text: "B" }] },
        ], violations: [],
      }), { status: 200 }));
    render(<TestCenter />);
    await screen.findByRole("button", { name: "Enter full-screen" });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
    fireEvent.click(screen.getByRole("button", { name: "Enter full-screen" }));
    expect(await screen.findByText("Second question")).toBeInTheDocument();
    expect(screen.queryByText("First question")).not.toBeInTheDocument();
    window.history.replaceState({}, "", "/tests");
    window.sessionStorage.clear();
  });
});
