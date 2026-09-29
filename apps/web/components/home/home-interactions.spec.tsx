import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CapabilityExplorer,
  PersonaSwitcher,
  PillarExplorer,
  type PillarExplorerItem,
} from "./home-interactions";

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

  it("exposes scroll-driven switching for the vertically centered pillar options", () => {
    const items: PillarExplorerItem[] = [
      { title: "Experts", body: "Expert path", bullets: ["Clear standards: Review first"], cta: "Join", href: "/register/freelancer" },
      { title: "Vendors", body: "Vendor path", bullets: ["Clear work orders: Deliver clearly"], cta: "Apply", href: "/register/vendor" },
      { title: "Clients", body: "Client path", bullets: ["Visible delivery: Track outcomes"], cta: "Deploy", href: "/register/client" },
    ];

    render(<PillarExplorer items={items} />);

    const explorer = document.querySelector('[data-scroll-switch="true"]');
    expect(explorer).not.toBeNull();
    expect(explorer?.querySelector('[role="tablist"]')).toHaveAttribute(
      "data-scroll-options",
      "vertical",
    );
    expect(explorer?.querySelector('[role="tabpanel"]')).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("locks wheel movement while changing between pillar options", async () => {
    const items: PillarExplorerItem[] = [
      { title: "Experts", body: "Expert path", bullets: ["Clear standards: Review first"], cta: "Join", href: "/register/freelancer" },
      { title: "Vendors", body: "Vendor path", bullets: ["Clear work orders: Deliver clearly"], cta: "Apply", href: "/register/vendor" },
      { title: "Clients", body: "Client path", bullets: ["Visible delivery: Track outcomes"], cta: "Deploy", href: "/register/client" },
    ];

    render(<PillarExplorer items={items} />);

    const explorer = document.querySelector('[data-scroll-switch="true"]');
    const middleOption = screen.getByRole("tab", { name: /Vendors/ });
    Object.defineProperty(explorer, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ top: 200, bottom: 748, height: 548 }),
    });
    const wheel = new WheelEvent("wheel", { deltaY: 220, cancelable: true });

    window.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(true);
    await waitFor(() => expect(middleOption).toHaveAttribute("aria-selected", "true"));
  });
});
