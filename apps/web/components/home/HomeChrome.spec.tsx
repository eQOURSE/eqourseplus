import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeHeader } from "./HomeChrome";

describe("FR-PUB-00 HomeHeader responsive disclosure", () => {
  afterEach(cleanup);

  it("defines the 768px and 480px presentation breakpoints", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "components/home/home-redesign.module.css"),
      "utf8",
    );

    expect(styles).toMatch(/@media\s*\(max-width:\s*768px\)/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*480px\)/);
    expect(styles).toMatch(/\.mobileToggle\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px/);
    expect(styles).toMatch(/\.mobileMenu\s*\{[\s\S]*max-height:\s*0/);
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.header\s*\{[\s\S]*border-radius:\s*24px/,
    );
  });

  it("keeps the mobile menu closed and exposes a labelled 48px toggle", () => {
    render(<HomeHeader />);

    const toggle = screen.getAllByRole("button", { name: "Open navigation menu" })[0];

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "home-mobile-navigation");
  });

  it("opens and closes the hidden navigation options", () => {
    render(<HomeHeader />);

    const toggle = screen.getAllByRole("button", { name: "Open navigation menu" })[0];
    const menu = document.getElementById("home-mobile-navigation");

    expect(menu).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Close navigation menu");
    expect(menu).toHaveAttribute("aria-hidden", "false");
    expect(within(menu!).getByRole("link", { name: "Login" })).toBeInTheDocument();

    fireEvent.click(menu!.querySelector('a[href="#categories"]')!);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveAttribute("aria-hidden", "true");
  });
});
