import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "./authenticated-shell";

vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("authenticated application shell", () => {
  it.each(["/profile", "/profile-reviews"])("uses the shared public chrome on %s", (pathname) => {
    window.history.replaceState({}, "", pathname);
    render(
      <AuthenticatedShell initialSession={{
        userId: "user-1",
        email: "owner@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
      }}>
        <p>Private content</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("banner")).toHaveClass("q-header");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByText("Private content")).toBeVisible();
  });

  it("uses an already-resolved session without requesting it again", () => {
    render(
      <AuthenticatedShell
        initialSession={{
          userId: "user-1",
          email: "owner@example.com",
          roleAssignments: [],
          profileState: "DRAFT",
        }}
      >
        <p>Company onboarding</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByText("owner@example.com")).toBeVisible();
    expect(screen.getByText("Company onboarding")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the wordmark, theme toggle, signed-in email and sign-out control", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        userId: "user-1",
        email: "owner@example.com",
        roleAssignments: [],
        profileState: "DRAFT",
      }),
    );

    render(
      <AuthenticatedShell>
        <p>Private content</p>
      </AuthenticatedShell>,
    );

    expect(await screen.findByText("owner@example.com")).toBeVisible();
    expect(screen.getByRole("link", { name: /eQOURSE/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(screen.getByText("Private content")).toBeVisible();
  });

  it("keeps a signed-in Verifier on the authenticated surface instead of redirecting to login", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        userId: "verifier-1",
        email: "verifier@example.com",
        roleAssignments: [{ role: "VERIFIER", businessUnit: "TUTRAIN" }],
        profileState: "DRAFT",
      }),
    );

    render(
      <AuthenticatedShell>
        <p>Company verification console</p>
      </AuthenticatedShell>,
    );

    expect(await screen.findByText("Company verification console")).toBeVisible();
    expect(screen.getByText("verifier@example.com")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("calls the existing same-origin logout handler", async () => {
    const navigate = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        response({
          userId: "user-1",
          email: "owner@example.com",
          roleAssignments: [],
          profileState: "DRAFT",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<AuthenticatedShell navigate={navigate}><p>Private content</p></AuthenticatedShell>);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});
