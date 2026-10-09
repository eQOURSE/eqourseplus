import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeHeader } from "./HomeChrome";

describe("FR-PUB-00 HomeHeader responsive disclosure", () => {
  afterEach(cleanup);

  it("collapses the navigation behind a 48px toggle at the 768px breakpoint", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "components/landing/chrome.css"),
      "utf8",
    );

    // The toggle must be showing at and below 768px; the header may collapse
    // earlier (wider breakpoint) to stay on one row.
    const collapse = styles.match(
      /@media\s*\(max-width:\s*(\d+)px\)\s*\{[^@]*\.q-nav__toggle\s*\{\s*display:\s*grid/,
    );
    expect(collapse, "toggle revealed inside a max-width media query").not.toBeNull();
    expect(Number(collapse?.[1])).toBeGreaterThanOrEqual(768);
    expect(styles).toMatch(/\.q-nav__toggle\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px/);
    expect(styles).toMatch(/\.q-sheet\s*\{[^}]*visibility:\s*hidden/);
  });

  it("keeps the mobile menu closed and exposes a labelled 48px toggle", () => {
    render(<HomeHeader />);

    const toggle = screen.getAllByRole("button", { name: "Open navigation menu" })[0];

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "home-mobile-navigation");
  });

  it("opens and closes the hidden navigation options", () => {
    render(<HomeHeader />);

    const toggle = screen.getAllByRole("button", { name: "Open navigation menu" })[0]!;
    const menu = document.getElementById("home-mobile-navigation");

    expect(menu).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Close navigation menu");
    expect(menu).toHaveAttribute("aria-hidden", "false");
    expect(within(menu!).getByRole("link", { name: "Login" })).toBeInTheDocument();

    fireEvent.click(menu!.querySelector('a[href="/clients"]')!);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveAttribute("aria-hidden", "true");
  });
});
