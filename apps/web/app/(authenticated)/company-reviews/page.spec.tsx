import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuthenticatedShell } from "../../../components/authenticated/authenticated-shell";

import CompanyReviewsPage, { metadata } from "./page";

afterEach(cleanup);

describe("FR-REG-07A company reviews page", () => {
  it("is a noindex authenticated application route", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    render(<CompanyReviewsPage />);
    expect(screen.getByRole("heading", { name: "Company verification" })).toBeVisible();
  });

  it("does not send a signed-in Verifier back to the dashboard", () => {
    window.history.replaceState({}, "", "/company-reviews");
    render(
      <AuthenticatedShell
        initialSession={{
          userId: "verifier-1",
          email: "verifier@example.com",
          roleAssignments: [{ role: "VERIFIER", businessUnit: "TUTRAIN" }],
          profileState: "DRAFT",
        }}
      >
        <CompanyReviewsPage />
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("heading", { name: "Company verification" })).toBeVisible();
    expect(screen.getByText("verifier@example.com")).toBeVisible();
    expect(window.location.pathname).toBe("/company-reviews");
  });
});
