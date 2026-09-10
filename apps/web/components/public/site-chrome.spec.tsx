import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter, SiteNavigation } from "./site-chrome";

afterEach(cleanup);

describe("FR-PUB-02 public navigation placement", () => {
  it("keeps Jobs out of primary navigation", () => {
    render(<SiteNavigation page="about" />);

    expect(screen.queryByRole("link", { name: "Jobs" })).not.toBeInTheDocument();
  });

  it("links to Jobs from the footer", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute(
      "href",
      "/jobs",
    );
  });
});
