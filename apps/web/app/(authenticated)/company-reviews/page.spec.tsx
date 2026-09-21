import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CompanyReviewsPage, { metadata } from "./page";

describe("FR-REG-07A company reviews page", () => {
  it("is a noindex authenticated application route", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    render(<CompanyReviewsPage />);
    expect(screen.getByRole("heading", { name: "Company verification" })).toBeVisible();
  });
});
