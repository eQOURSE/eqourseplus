import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../components/dashboard/dashboard-home", () => ({
  DashboardHome: () => <h1>Your workspace</h1>,
}));

import DashboardPage, { metadata } from "./page";

describe("FR-REG-16/17/18 dashboard page", () => {
  it("is a noindex authenticated role home", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Your workspace" })).toBeVisible();
  });
});
