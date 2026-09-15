import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CompanyOnboardingEntry } from "./company-onboarding-entry";

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("company onboarding entry", () => {
  it("shows the fillable public registration flow when no session exists", async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401));
    render(<CompanyOnboardingEntry actor="vendor" />);

    expect(await screen.findByRole("heading", { name: "Register your company." })).toBeVisible();
    expect(screen.getByLabelText("Legal name")).toBeEnabled();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  });

  it("shows the authenticated shell and loads the persisted draft for a signed-in person", async () => {
    fetchMock
      .mockResolvedValueOnce(response({
        userId: "user-1",
        email: "owner@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
      }))
      .mockResolvedValueOnce(response({
        _id: "vendor-1",
        ownerUserId: "user-1",
        state: "DRAFT",
        legalName: "Saved Company",
        capabilities: [],
        countryIdentifiers: [],
        documents: [],
      }));

    render(<CompanyOnboardingEntry actor="vendor" />);

    expect(await screen.findByText("owner@example.com")).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText("Legal name")).toHaveValue("Saved Company"));
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/vendors/me", { cache: "no-store" });
  });
});
