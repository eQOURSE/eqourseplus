import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";
import { approvedHome } from "../content/approved-home";

afterEach(cleanup);
describe("approved homepage architecture", () => {
  it("uses the supplied H1 and hero copy verbatim", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Partner for World-Class AI and Content");
    expect(screen.getByText(approvedHome.subheadline)).toBeInTheDocument();
  });
  it("keeps seven native FAQs matched exactly to FAQPage JSON-LD", () => {
    const { container } = render(<HomePage />);
    const faq = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(s => JSON.parse(s.textContent ?? "{}")).find(s => s["@type"] === "FAQPage");
    const items = Array.from(container.querySelectorAll("#faq details"));
    expect(items).toHaveLength(7);
    expect(faq.mainEntity).toHaveLength(7);
    items.forEach((item, i) => {
      expect(item.querySelector("summary")?.textContent).toBe(faq.mainEntity[i].name);
      expect(item.querySelector("p")?.textContent).toBe(faq.mainEntity[i].acceptedAnswer.text);
    });
  });
  it("renders every supplied pillar, specialization and governance statement", () => {
    const { container } = render(<HomePage />);
    approvedHome.pillars.forEach(pillar => pillar.filter(s => !s.startsWith("[")).forEach(s => expect(container).toHaveTextContent(s.replace("Headline (H3): ", ""))));
    approvedHome.tracks.slice(1).forEach(s => { expect(container).toHaveTextContent(s.split(": ")[0]!); expect(container).toHaveTextContent(s.split(": ").slice(1).join(": ")); });
    approvedHome.governance.slice(1).forEach(s => { expect(container).toHaveTextContent(s.split(": ")[0]!); expect(container).toHaveTextContent(s.split(": ").slice(1).join(": ")); });
  });
  it("changes audience selection with keyboard-operable glass controls and exact CTA names", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("radio", { name: "For Vendor Agencies" }));
    expect(screen.getByRole("link", { name: /Join as an Agency Partner/ })).toHaveAttribute("href", "/register/vendor");
    fireEvent.keyDown(screen.getByRole("radio", { name: "For Vendor Agencies" }), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "For Enterprise Clients" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("link", { name: /Deploy Expert Teams/ })).toHaveAttribute("href", "/register/client");
  });
});
