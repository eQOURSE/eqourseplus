import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileState } from "@eqourse/shared";

import { CompanyOnboardingEntry } from "./company-onboarding-entry";
import { PublicSessionProvider } from "../public/public-session-provider";

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

    await waitFor(() => expect(screen.getByRole("heading", { name: "Tell us about your business." })).toBeVisible());
    expect(screen.getByLabelText("Legal name")).toBeEnabled();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Back to role choice/ })).toHaveAttribute("href", "/register");
  });

  it("keeps authenticated navigation and loads the persisted draft for a signed-in person", async () => {
    fetchMock.mockImplementation((path) => {
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

    render(<PublicSessionProvider session={{
      userId: "user-1",
      email: "owner@example.com",
      roleAssignments: [],
      profileState: ProfileState.DRAFT,
    }}><CompanyOnboardingEntry actor="vendor" /></PublicSessionProvider>);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Tell us about your business." })).toBeVisible());
    await waitFor(() => expect(screen.getByLabelText("Legal name")).toHaveValue("Saved Company"));
    expect(screen.getByLabelText("Signed in user")).toHaveTextContent("owner@example.com");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(screen.getByRole("contentinfo")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/vendors/me", { cache: "no-store" });
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/session", { cache: "no-store" });
  });
});
