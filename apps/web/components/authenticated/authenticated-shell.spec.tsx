import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "./authenticated-shell";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("authenticated application shell", () => {
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
    expect(screen.getByRole("button", { name: /Switch to (dark|light) mode/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(screen.getByText("Private content")).toBeVisible();
  });

  it("calls the existing same-origin logout handler", async () => {
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

    render(<AuthenticatedShell><p>Private content</p></AuthenticatedShell>);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
