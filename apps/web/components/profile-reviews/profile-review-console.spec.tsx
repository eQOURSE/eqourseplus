import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileReviewConsole } from "./profile-review-console";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("FR-REG-07 profile review console", () => {
  it("lists an opaque queue item, opens submitted data, and sends the audited decision", async () => {
    const id = "507f1f77bcf86cd799439011";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path === "/api/v1/profiles/reviews") return Response.json([{ id, state: "SUBMITTED", submittedAt: "2026-10-10T08:00:00.000Z" }]);
      if (path === `/api/v1/profiles/reviews/${id}` && !init?.method) return Response.json({ id, state: "SUBMITTED", submittedAt: "2026-10-10T08:00:00.000Z", personal: { firstName: "Ada", lastName: "Lovelace" }, education: [], skills: [], languages: [], samples: [] });
      if (path === `/api/v1/profiles/reviews/${id}/decisions`) return Response.json({ _id: id, state: "UNDER_REVIEW", submittedAt: "2026-10-10T08:00:00.000Z", personal: { firstName: "Ada", lastName: "Lovelace" } });
      return new Response(null, { status: 404 });
    });

    render(<ProfileReviewConsole />);
    await waitFor(() => expect(screen.getByText(id)).toBeVisible());
    await screen.findByRole("button", { name: `Open freelancer profile ${id}` }).then((button) => button.click());
    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Initial evidence review" } });
    fireEvent.click(screen.getByRole("button", { name: "Start review" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`/api/v1/profiles/reviews/${id}/decisions`, expect.objectContaining({ method: "POST" })));
    await waitFor(() => expect(screen.getByRole("button", { name: `Open freelancer profile ${id}` })).toBeVisible());
  });

  it("allows ordinary qualification feedback without treating it as copied PII", async () => {
    const id = "507f1f77bcf86cd799439012";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      if (path === "/api/v1/profiles/reviews") return Response.json([{ id, state: "UNDER_REVIEW", submittedAt: "2026-10-10T08:00:00.000Z" }]);
      if (path === `/api/v1/profiles/reviews/${id}`) return Response.json({ _id: id, state: "UNDER_REVIEW", personal: {}, education: [{ qualification: "Degree", fieldOfStudy: "Math" }] });
      return Response.json({ _id: id, state: "UNDER_REVIEW" });
    });
    render(<ProfileReviewConsole />);
    await screen.findByRole("button", { name: `Open freelancer profile ${id}` }).then((button) => button.click());
    await screen.findByRole("heading", { name: "Freelancer profile" });
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Degree evidence missing" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve for testing" }));
    await waitFor(() => expect(screen.getByRole("button", { name: `Open freelancer profile ${id}` })).toBeVisible());
  });
});
