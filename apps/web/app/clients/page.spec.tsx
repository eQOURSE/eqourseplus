import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ClientsPage, { metadata } from "./page";

const pageStyles = readFileSync(
  resolve(process.cwd(), "app/clients/clients-page.module.css"),
  "utf8",
);
const pageSource = readFileSync(
  resolve(process.cwd(), "app/clients/page.tsx"),
  "utf8",
);

afterEach(cleanup);

describe("FR-PUB-07 clients landing page", () => {
  it("renders the client delivery story with shared chrome", () => {
    const { container } = render(<ClientsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Verified Expert Teams");
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From Project Brief to Audited Delivery" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Client FAQ" })).toBeInTheDocument();
    expect(container.querySelectorAll("summary")).toHaveLength(10);
  });

  it("exports indexable metadata and resolves the client CTA", () => {
    render(<ClientsPage />);

    expect(metadata.alternates).toEqual({ canonical: "/clients", languages: { en: "/clients", "x-default": "/clients" } });
    expect(screen.getAllByRole("link", { name: /Discuss Your Project/ })[0]).toHaveAttribute("href", "/register/client");
    expect(document.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
  });

  it("uses the shared light and dark surface tokens throughout the page styles", () => {
    expect(pageStyles).toMatch(/\.page\s*\{[\s\S]*background-color:\s*hsl\(var\(--background\)\)/);
    expect(pageStyles).toMatch(/background:\s*hsl\(var\(--card\)\)/);
    expect(pageStyles).toMatch(/color:\s*hsl\(var\(--foreground\)\)/);
    expect(pageStyles).toMatch(/color:\s*hsl\(var\(--muted-foreground\)\)/);
  });

  it("animates the project path timeline steps with left/right TimelineSlideIn", () => {
    expect(pageSource).toContain("TimelineSlideIn");
    expect(pageSource).toMatch(/side=\{side\}/);
  });
});
