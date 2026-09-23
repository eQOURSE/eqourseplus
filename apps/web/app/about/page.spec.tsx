import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { structuredData as homeStructuredData } from "../home-data";
import { RESOLVING_ROUTES } from "../public-routes";
import { aboutStructuredData, faqs } from "./about-data";
import AboutPage from "./page";

afterEach(cleanup);

describe("FR-PUB-05 /about", () => {
  it("has exactly one H1, section H2s, and domain H3s", () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelectorAll("h2").length).toBeGreaterThanOrEqual(10);
    expect(container.querySelectorAll("h3")).toHaveLength(16);
  });

  it("renders the final content structure and every CTA", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { name: "A Verified Talent Network for AI Data and Content Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expertise Across AI Data, Content and Specialist Delivery" })).toBeInTheDocument();
    expect(screen.getByText("Specialist network and delivery capability across the eQOURSE group.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Our Network/ })).toHaveAttribute("href", "/freelancers");
    expect(screen.getByRole("link", { name: /How eQOURSE\+ Works/ })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByRole("link", { name: /More for specialists/ })).toHaveAttribute("href", "/freelancers");
    expect(screen.getByRole("link", { name: /More for vendor agencies/ })).toHaveAttribute("href", "/vendors");
    expect(screen.getByRole("link", { name: /Hire Experts/ })).toHaveAttribute("href", "/register/client");
    expect(screen.getByRole("link", { name: /Join as an Expert/ })).toHaveAttribute("href", "/register/freelancer");
    expect(screen.getAllByRole("link", { name: /Join as a Vendor/ }).some((link) => link.getAttribute("href") === "/register/vendor")).toBe(true);
  });

  it("self-hosts the showcase image at its displayed dimensions with meaningful alt text", () => {
    render(<AboutPage />);

    const image = screen.getByRole("img", {
      name: "eQOURSE+ verified talent and quality-led delivery showcase",
    });

    expect(image).toHaveAttribute("src", expect.stringContaining("about-showcase-display.jpg"));
    expect(image).toHaveAttribute("width", "958");
    expect(image).toHaveAttribute("height", "446");
  });

  it("keeps FAQ answers in the SSR DOM and exposes native disclosures", () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelectorAll("details")).toHaveLength(faqs.length);
    expect(container.querySelectorAll("summary")).toHaveLength(faqs.length);
    expect(screen.getByText(faqs[0][1])).toBeInTheDocument();
  });

  it("emits exactly one unchanged canonical Organization node", () => {
    const { container } = render(<AboutPage />);
    const blocks = [...container.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent ?? ""));
    const organizations = blocks.filter((block) => block["@type"] === "Organization");
    expect(organizations).toHaveLength(1);
    expect(organizations[0]["@id"]).toBe(homeStructuredData[0]["@id"]);
    expect(organizations[0].name).toBe(homeStructuredData[0].name);
    expect(organizations[0].url).toBe(homeStructuredData[0].url);
    expect(organizations[0].parentOrganization).toEqual(homeStructuredData[0].parentOrganization);
    expect(organizations[0].hasCertification).toContainEqual({
      "@type": "Certification",
      name: "ISO/IEC 27001",
    });
  });

  it("publishes FAQPage and keeps every structured-data block safe", () => {
    const { container } = render(<AboutPage />);
    const blocks = [...container.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent ?? ""));
    expect(blocks.map((block) => block["@type"])).toEqual(["Organization", "FAQPage", "BreadcrumbList"]);
    expect(blocks[1].mainEntity).toHaveLength(faqs.length);
    expect(aboutStructuredData).toHaveLength(3);
    for (const script of container.querySelectorAll('script[type="application/ld+json"]')) expect(script.textContent).not.toContain("<");
  });

  it("keeps the indexed route registered and excludes prohibited public identifiers", () => {
    expect(RESOLVING_ROUTES).toContain("/about");
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\b(?:PAN|GSTIN|UEN|CIN|LLPIN)\b/i);
    expect(text).not.toMatch(/\b\d{1,5}\s+(?:[A-Z][\w.-]*\s+){0,4}(?:Street|Road|Avenue|Lane|Drive|Boulevard)\b/i);
  });

  it("remains a server page", () => {
    const source = readFileSync(resolve(process.cwd(), "app/about/page.tsx"), "utf8");
    expect(source).not.toContain('"use client"');
  });
});
