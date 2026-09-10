import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter, SiteNavigation } from "./site-chrome";

afterEach(cleanup);

describe("FR-PUB-02 public navigation placement", () => {
  it("keeps Jobs out of primary navigation", () => {
    render(<SiteNavigation page="about" />);

    expect(screen.queryByRole("link", { name: "Jobs" })).not.toBeInTheDocument();
  });

  it("links to Jobs from the footer", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute(
      "href",
      "/jobs",
    );
  });
  it("renders home navigation with correct links and home region attribute", () => {
    const { container } = render(<SiteNavigation page="home" />);

    expect(container.querySelector("#site-navigation")).toHaveAttribute(
      "data-home-region",
      "true",
    );
    expect(
      Array.from(
        container.querySelectorAll<HTMLAnchorElement>(
          "#site-navigation .home-nav-links a",
        ),
        (link) => link.getAttribute("href"),
      ),
    ).toEqual([
      "#how-it-works",
      "#categories",
      "/freelancers",
      "/vendors",
      "/about",
    ]);
  });

  it("sets aria-current='page' on the active non-home link", () => {
    const { container, unmount } = render(<SiteNavigation page="freelancers" />);
    const activeFreelancerLink = container.querySelector(
      "#site-navigation .home-nav-links a[aria-current='page']",
    );
    expect(activeFreelancerLink).toHaveAttribute("href", "/freelancers");
    unmount();

    const { container: vendorContainer } = render(<SiteNavigation page="vendors" />);
    const activeVendorLink = vendorContainer.querySelector(
      "#site-navigation .home-nav-links a[aria-current='page']",
    );
    expect(activeVendorLink).toHaveAttribute("href", "/vendors");
  });

  it("toggles the mobile navigation from the menu button", () => {
    const { container } = render(<SiteNavigation page="home" />);
    const menuButton = screen.getByRole("button", {
      name: "Open navigation menu",
    });
    const links = container.querySelector(".home-nav-links");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(links).not.toHaveClass("is-open");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(menuButton).toHaveAccessibleName("Close navigation menu");
    expect(links).toHaveClass("is-open");
  });

  it("keeps site chrome server-rendered and uses a dependency-free menu icon", () => {
    const source = readFileSync(resolve(process.cwd(), "components/public/site-chrome.tsx"), "utf8");
    render(<SiteNavigation page="home" />);

    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("<Menu");
    expect(screen.getByRole("button", { name: "Open navigation menu" }).querySelector("svg"))
      .toBeInTheDocument();
  });

  it("gives the mobile toggle a 48px target and visible focus styling", () => {
    expect(globalStyles).toMatch(/\.home-menu-toggle\s*\{[\s\S]*min-width:\s*3rem[\s\S]*min-height:\s*3rem/);
    expect(globalStyles).toMatch(/\.home-menu-toggle:focus-visible\s*\{[\s\S]*outline:/);
  });

  it("keeps the expandable toggle in the navbar actions cell", () => {
    render(<SiteNavigation page="home" />);

    expect(
      screen.getByRole("button", { name: "Open navigation menu" }).parentElement,
    ).toHaveClass("home-nav-actions");
  });

  it("renders the mobile menu icon at the enlarged size", () => {
    render(<SiteNavigation page="home" />);

    expect(
      screen.getByRole("button", { name: "Open navigation menu" }).querySelector("svg"),
    ).toHaveAttribute("width", "28");
    expect(
      screen.getByRole("button", { name: "Open navigation menu" }).querySelector("svg"),
    ).toHaveAttribute("height", "28");
  });

  it("defines responsive grid and card radius rules for small screen sizes", () => {
    expect(globalStyles).toMatch(/@media\s*\(max-width:\s*47\.999rem\)/);
    expect(globalStyles).toMatch(/\.home-nav-links\s*>\s*:last-child:nth-child\(odd\)/);
    expect(globalStyles).toMatch(/@media\s*\(max-width:\s*25rem\)/);
    expect(globalStyles).toMatch(/\.home-nav-links\s*\{[\s\S]*max-height:\s*0/);
    expect(globalStyles).toMatch(/\.home-nav-links\.is-open\s*\{/);
  });

  it("animates the mobile navigation when opening and closing", () => {
    expect(globalStyles).toMatch(
      /\.home-nav-links\s*\{[\s\S]*max-height:\s*0[\s\S]*opacity:\s*0[\s\S]*transition:/,
    );
    expect(globalStyles).toMatch(
      /\.home-nav-links\.is-open\s*\{[\s\S]*max-height:\s*\d+rem[\s\S]*opacity:\s*1/,
    );
    expect(globalStyles).toMatch(
      /\.home-nav-links\.is-open\s*\{[\s\S]*visibility:\s*visible/,
    );
  });
});
