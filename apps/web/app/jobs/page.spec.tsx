import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JobsPage, { metadata } from "./page";

afterEach(cleanup);

describe("FR-PUB-02 jobs listing", () => {
  it("sets page metadata to noindex", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("renders an SSR-friendly jobs heading, filters, and seeded job links", async () => {
    render(await JobsPage({ searchParams: {} }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find work that values proof and quality",
    );
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view job/i }).length).toBeGreaterThan(0);
  });

  it("applies category and language query filters", async () => {
    render(
      await JobsPage({
        searchParams: { category: "AI Data Services", language: "Hindi" },
      }),
    );

    expect(screen.getAllByText("Hindi AI response evaluator").length).toBeGreaterThan(0);
    expect(screen.queryByText("English curriculum reviewer")).not.toBeInTheDocument();
  });
});
