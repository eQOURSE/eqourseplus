import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("FR-FND-01 web scaffold", () => {
  it("renders the eQOURSE+ foundation screen", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /eQOURSE\+/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/foundation is ready/i)).toBeInTheDocument();
  });
});
