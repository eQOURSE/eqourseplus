import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../components/profile-wizard/profile-wizard", () => ({
  ProfileWizard: () => <h1>Build your profile</h1>,
}));

import ProfilePage, { metadata } from "./page";

describe("FR-REG-02B profile page", () => {
  it("is a noindex authenticated application route without a role gate", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "Build your profile" })).toBeVisible();
  });
});
