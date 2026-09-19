import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CapabilityExplorer, PersonaSwitcher } from "./home-interactions";

afterEach(cleanup);

describe("FR-PUB-00-HOME-DESIGN interactions", () => {
  it("switches the hero persona content with accessible pressed states", () => {
    render(<PersonaSwitcher />);

    const specialist = screen.getByRole("button", {
      name: "Specialist or Domain Expert",
    });
    fireEvent.click(specialist);

    expect(specialist).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Join verified AI data projects/i)).toBeVisible();
  });

  it("switches capability detail panels from the keyboard-operable tab list", () => {
    render(<CapabilityExplorer />);

    const science = screen.getByRole("tab", { name: /Science & STEM/i });
    fireEvent.click(science);

    expect(science).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Post-doctoral reasoning",
    );
  });
});
