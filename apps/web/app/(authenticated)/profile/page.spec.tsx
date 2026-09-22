import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "../../../components/authenticated/authenticated-shell";

vi.mock("../../../components/profile-wizard/profile-wizard", () => ({
  ProfileWizard: () => <h1>Build your profile</h1>,
}));

import ProfilePage, { metadata } from "./page";

afterEach(cleanup);

describe("FR-REG-02B profile page", () => {
  it("is a noindex authenticated application route without a role gate", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "Build your profile" })).toBeVisible();
  });

  it("remains directly reachable for a signed-in Verifier", () => {
    render(
      <AuthenticatedShell
        initialSession={{
          userId: "verifier-1",
          email: "verifier@example.com",
          roleAssignments: [{ role: "VERIFIER", businessUnit: "EQOURSE" }],
          profileState: "DRAFT",
        }}
      >
        <ProfilePage />
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("heading", { name: "Build your profile" })).toBeVisible();
    expect(screen.getByText("verifier@example.com")).toBeVisible();
  });
});
