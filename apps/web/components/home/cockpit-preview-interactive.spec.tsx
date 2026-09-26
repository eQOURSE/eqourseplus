import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CockpitPreview } from "./CockpitPreviewInteractive";

afterEach(cleanup);

describe("FR-PUB-01 interactive cockpit preview", () => {
  it("switches between accessible bar, line, and pie chart panels", async () => {
    render(<CockpitPreview />);

    const barTab = screen.getByRole("tab", { name: "Bar chart" });
    const lineTab = screen.getByRole("tab", { name: "Line chart" });
    const pieTab = screen.getByRole("tab", { name: "Pie chart" });

    expect(barTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Bar chart");
    await waitFor(() => expect(screen.getByLabelText("Weekly throughput bar chart")).toBeVisible());

    fireEvent.click(lineTab);
    expect(lineTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Line chart");
    await waitFor(() => expect(screen.getByLabelText("Weekly throughput line chart")).toBeVisible());
    expect(screen.queryByLabelText("Weekly throughput bar chart")).not.toBeInTheDocument();

    fireEvent.click(pieTab);
    expect(pieTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Pie chart");
    await waitFor(() => expect(screen.getByLabelText("Project status pie chart")).toBeVisible());
    expect(screen.queryByLabelText("Weekly throughput line chart")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation across the chart tabs", async () => {
    render(<CockpitPreview />);

    const barTab = screen.getByRole("tab", { name: "Bar chart" });
    fireEvent.keyDown(barTab, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "Line chart" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() => expect(screen.getByLabelText("Weekly throughput line chart")).toBeVisible());

    fireEvent.keyDown(barTab, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Pie chart" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() => expect(screen.getByLabelText("Project status pie chart")).toBeVisible());
  });
});
