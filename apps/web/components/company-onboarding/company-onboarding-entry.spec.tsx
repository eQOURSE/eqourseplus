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
});

describe("company onboarding entry", () => {
  it("shows the fillable public registration flow when no session exists", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/auth/session") return Promise.resolve(response({}, 401));
      if (String(path).endsWith("/api/v1/skill-taxonomy")) return Promise.resolve(response([]));
      return Promise.resolve(response({}, 404));
    });
    render(<CompanyOnboardingEntry actor="vendor" />);

    expect(await screen.findByRole("heading", { name: "Tell us about your business." })).toBeVisible();
    expect(screen.getByLabelText("Legal name")).toBeEnabled();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  });

  it("uses the shared HomeChrome shell and loads the persisted draft for a signed-in person", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/auth/session") return Promise.resolve(response({
        userId: "user-1",
        email: "owner@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
      }));
      if (String(path).endsWith("/api/v1/skill-taxonomy")) return Promise.resolve(response([]));
      if (path === "/api/v1/vendors/me") return Promise.resolve(response({
        _id: "vendor-1",
        ownerUserId: "user-1",
        state: "DRAFT",
        legalName: "Saved Company",
        capabilities: [],
        countryIdentifiers: [],
        documents: [],
      }));
      return Promise.resolve(response({}, 404));
    });

    render(<CompanyOnboardingEntry actor="vendor" />);

    expect(await screen.findByRole("heading", { name: "Tell us about your business." })).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText("Legal name")).toHaveValue("Saved Company"));
    expect(screen.getByRole("banner")).toBeVisible();
    expect(screen.getByRole("contentinfo")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/vendors/me", { cache: "no-store" });
  });
});
