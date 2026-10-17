import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ProfileReviewsPage, { metadata } from "./page";

afterEach(cleanup);

describe("FR-REG-07 freelancer profile review page", () => {
  it("is an authenticated noindex verifier workspace", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    render(<ProfileReviewsPage />);
    expect(screen.getByRole("heading", { name: "Freelancer profile review" })).toBeVisible();
  });
});
