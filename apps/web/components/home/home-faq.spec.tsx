import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeFaq } from "./HomeFaq";

const styles = readFileSync(
  resolve(process.cwd(), "components/home/home-redesign.module.css"),
  "utf8",
);

function cssRule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return styles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

afterEach(cleanup);

describe("FR-PUB-01 responsive home FAQ", () => {
  it("renders native, keyboard-operable disclosure items", () => {
    const { container } = render(<HomeFaq />);
    const items = container.querySelectorAll("details");

    expect(items).toHaveLength(7);
    expect(items[0]).toHaveAttribute("open");
    expect(container.querySelectorAll("summary")).toHaveLength(7);
    expect(
      screen.getByText(/enterprise clients maintain control/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/support multiple languages/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/which countries can experts work from/i),
    ).toBeInTheDocument();
  });

  it("uses fluid sizing and wrapping instead of desktop-only dimensions", () => {
    expect(cssRule(".faq .inner")).toMatch(
      /width:\s*min\(calc\(100% - 32px\),\s*820px\)/,
    );
    expect(cssRule(".faqList")).toMatch(/padding:\s*0/);
    expect(cssRule(".faqList summary")).toMatch(
      /font-size:\s*clamp\(16px,\s*2vw,\s*20px\)/,
    );
    expect(cssRule(".faqList summary span")).toMatch(/overflow-wrap:\s*anywhere/);
    expect(cssRule(".faq")).toMatch(/scroll-margin-top:\s*90px/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*\.faqList details/);
  });
});
