import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { contrast, parseHsl } from "../../../../packages/ui/test/contrast-helpers";
import { HomeHeader, PUBLIC_CHROME_HREFS } from "../home/HomeChrome";
import { DeliveryBoard } from "./delivery-board";
import { Faq, FinalCta } from "./faq-cta";
import { GlassBox } from "./glass-box";
import { buildRefractionPixels, DEFAULT_OPTICS, displacementProfile, rayDisplacement, squircle } from "./glass-optics";
import { LiquidGlass, supportsBackdropRefraction } from "./liquid-glass";
import { Pillars } from "./pillars";
import { SEGMENTS } from "./segments";
import { SpecializationTracks, trackMatches } from "./tracks";
import { LAND_COUNT, LAND_MASK } from "./world-dots.data";
import { landAt, WorldMap } from "./world-map";

const css = (file: string) =>
  readFileSync(resolve(process.cwd(), `components/landing/${file}`), "utf8");
const landingCss = css("landing.css");
const chromeCss = css("chrome.css");
const heroCss = css("hero.css");
const faqCss = css("faq-cta.css");
const tracksCss = css("tracks.css");

function themeBlock(selector: string) {
  // tolerate LF or CRLF checkouts between selector lines
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\n/g, "\\s*");
  return landingCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

function token(block: string, name: string) {
  const value = block.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
  if (!value) throw new Error(`missing --${name}`);
  return parseHsl(value);
}

afterEach(cleanup);

describe("segment CTAs", () => {
  it("defines exactly the three audiences with registration and learn-more routes", () => {
    expect(SEGMENTS.map((item) => [item.audience, item.cta, item.href, item.learnMoreHref])).toEqual([
      ["For Freelance Experts", "Apply as an Expert", "/register/freelancer", "/freelancers"],
      ["For Vendor Agencies", "Join as an Agency Partner", "/register/vendor", "/vendors"],
      ["For Enterprise Clients", "Deploy Expert Teams", "/register/client", "/clients"],
    ]);
    expect(SEGMENTS[0]?.note).toBe("Work Remotely");
  });

  it("puts all three segments plus Login in the shared header on every page", () => {
    const { container } = render(<HomeHeader />);
    const nav = container.querySelector("#site-navigation")!;
    for (const item of SEGMENTS) {
      expect(within(nav as HTMLElement).getByRole("link", { name: new RegExp(item.cta) })).toHaveAttribute("href", item.href);
    }
    expect(within(nav as HTMLElement).getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    for (const item of SEGMENTS) expect(PUBLIC_CHROME_HREFS).toContain(item.href);
  });

  it("closes with the three approved conversion links plus Login", () => {
    render(<FinalCta />);
    for (const [label, note, href] of [
      ["Apply as a Domain Expert", "Flexible, Remote, Verified", "/register/freelancer"],
      ["Register as a Vendor Partner", "High-Volume Enterprise Pipelines", "/register/vendor"],
      ["Talk to Our Enterprise Solutions Team", "Deploy Dedicated Talent", "/register/client"],
    ] as const) {
      const link = screen.getByRole("link", { name: new RegExp(label) });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveTextContent(note);
    }
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });
});

describe("theme switch", () => {
  it("flips the document theme and persists the choice", () => {
    document.documentElement.dataset.theme = "light";
    render(<HomeHeader />);
    const toggle = screen.getByRole("switch", { name: "Dark theme" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("eqourse-theme")).toBe("dark");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("delivery cockpit preview", () => {
  it("is exposed as one labelled illustration with the approved display address", () => {
    render(<DeliveryBoard />);
    const board = screen.getByRole("img", { name: /Illustrative preview/ });
    expect(board).toHaveTextContent("plus.eqourse.com/cockpit/telemetry-live");
    expect(board).toHaveTextContent("Illustrative preview");
  });

  it("shows workflow states only, never invented figures", () => {
    const { container } = render(<DeliveryBoard />);
    expect(container.textContent).not.toMatch(/\d/);
  });
});

describe("specialization domain finder", () => {
  const searchbox = () => screen.getByRole("searchbox", { name: /search specialization tracks/i });

  it("lists all eight tracks with their approved copy", () => {
    const { container } = render(<SpecializationTracks />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
    expect(container.querySelectorAll('[data-match="all"]')).toHaveLength(8);
    expect(screen.getByText(/across 30\+ global languages/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing all eight specialization tracks.");
  });

  it("filters by expertise, moves matches to the front and announces the result", () => {
    const { container } = render(<SpecializationTracks />);
    fireEvent.change(searchbox(), { target: { value: "python" } });

    expect(screen.getByRole("status")).toHaveTextContent(/1 of 8 tracks match/);
    const matches = container.querySelectorAll('[data-match="yes"]');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toHaveTextContent("Software Engineering & Code Intelligence");
    expect(matches[0]).toHaveTextContent("Match");
    expect(container.querySelector(".q-dom")).toHaveAttribute("data-track", "code");
    expect(container.querySelectorAll('[data-match="no"]')).toHaveLength(7);
  });

  it("offers example skills and a clear control", () => {
    render(<SpecializationTracks />);
    fireEvent.click(screen.getByRole("button", { name: "Radiology" }));
    expect(screen.getByRole("button", { name: "Radiology" })).toHaveAttribute("aria-pressed", "true");
    expect(searchbox()).toHaveValue("Radiology");
    expect(screen.getByRole("status")).toHaveTextContent(/1 of 8 tracks match/);

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(searchbox()).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("Showing all eight");
  });

  it("matches word prefixes from the copy and common job titles", () => {
    expect(trackMatches("clinical", "radiolog")).toBe(true);
    expect(trackMatches("language", "Hindi")).toBe(true);
    expect(trackMatches("stem", "maths")).toBe(true);
    expect(trackMatches("legal", "contract law")).toBe(true);
    expect(trackMatches("rlhf", "Red-teaming")).toBe(true);
    expect(trackMatches("code", "hindi")).toBe(false);
    expect(trackMatches("robotics", "")).toBe(true);
  });

  it("explains when nothing matches", () => {
    render(<SpecializationTracks />);
    fireEvent.change(searchbox(), { target: { value: "zzzz" } });
    expect(screen.getByRole("status")).toHaveTextContent(/No track matches/);
  });
});

describe("dual-jurisdiction world map", () => {
  it("is one labelled illustration with India and Singapore pinned", () => {
    render(<WorldMap />);
    const map = screen.getByRole("img", { name: /India and Singapore/ });
    expect(map).toHaveTextContent("India");
    expect(map).toHaveTextContent("Singapore");
    expect(map.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("draws continents from a land mask in the right places", () => {
    const bits = atob(LAND_MASK);
    let count = 0;
    for (let index = 0; index < bits.length; index += 1) {
      let byte = bits.charCodeAt(index);
      while (byte) {
        count += byte & 1;
        byte >>= 1;
      }
    }
    expect(count).toBe(LAND_COUNT);
    expect(landAt(78.96, 20.59)).toBe(true); // central India
    expect(landAt(133.8, -25.3)).toBe(true); // central Australia
    expect(landAt(-100, 40)).toBe(true); // central United States
    expect(landAt(-150, 0)).toBe(false); // central Pacific
    expect(landAt(-30, 30)).toBe(false); // central Atlantic
    expect(landAt(80, -10)).toBe(false); // Indian Ocean
  });

  it("renders sourced vector coastlines and a clear India focus without a raster map", () => {
    const { container } = render(<WorldMap />);
    const coast = container.querySelector<SVGPathElement>(".q-map__coast");
    const india = container.querySelector<SVGPathElement>(".q-map__india");
    expect(coast?.getAttribute("d")?.length).toBeGreaterThan(10000);
    expect(india?.getAttribute("d")?.length).toBeGreaterThan(1000);
    expect(container.querySelector(".q-map img")).toBeNull();
    const map = container.querySelector<HTMLElement>(".q-map")!;
    expect(map.style.getPropertyValue("--q-map-world")).not.toBe(map.style.getPropertyValue("--q-map-zoom"));
  });

  it("includes the India-viewpoint boundary around PoK and Aksai Chin", () => {
    const { container } = render(<WorldMap />);
    const outline = container.querySelector<SVGPathElement>(".q-map__india")!.getAttribute("d")!;
    const contains = (lon: number, lat: number) => {
      const x = (lon + 180) * 2;
      const y = (75 - lat) * 2;
      return Array.from(outline.matchAll(/M([^Z]+)Z/g)).some((ring) => {
        const numbers = Array.from((ring[1] ?? "").matchAll(/-?\d+(?:\.\d+)?/g), (match) => Number(match[0]));
        let inside = false;
        for (let i = 0, j = numbers.length - 2; i < numbers.length; j = i, i += 2) {
          const xi = numbers[i]!, yi = numbers[i + 1]!;
          const xj = numbers[j]!, yj = numbers[j + 1]!;
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      });
    };

    expect(contains(73.47, 34.37)).toBe(true); // Muzaffarabad, PoK
    expect(contains(74.31, 35.92)).toBe(true); // Gilgit-Baltistan, PoK
    expect(contains(79.5, 35)).toBe(true); // Aksai Chin
    expect(contains(77.2, 28.6)).toBe(true); // Delhi
    expect(contains(69, 31)).toBe(false); // Pakistan outside the claim boundary
  });
});

describe("who we empower", () => {
  it("shows distinct artwork for experts, agencies and enterprises", () => {
    const { container } = render(<Pillars />);
    const artwork = Array.from(container.querySelectorAll<HTMLImageElement>(".q-aud__artwork"));

    for (const [index, path] of [
      "/images/pillars/expert.png",
      "/images/pillars/agency.png",
      "/images/pillars/enterprise.png",
    ].entries()) {
      expect(decodeURIComponent(artwork[index]?.getAttribute("src") ?? "")).toContain(path);
    }
    expect(artwork.map((image) => image.getAttribute("alt"))).toEqual([
      "Independent expert working on a digital project",
      "Agency team collaborating on a shared delivery project",
      "Enterprise team reviewing project delivery",
    ]);
    expect(container.querySelectorAll(".q-pv")).toHaveLength(0);
  });

  it("uses a distinct theme-ready illustration thumbnail for each specialization track", () => {
    const { container } = render(<SpecializationTracks />);
    const thumbnails = container.querySelectorAll(".q-dom__thumbnail");
    expect(thumbnails).toHaveLength(8);
    for (const id of ["language", "stem", "code", "legal", "clinical", "curriculum", "robotics", "rlhf"]) {
      expect(container.querySelector(`.q-dom[data-track="${id}"] .q-dom__thumbnail`)).toHaveAttribute("src", expect.stringContaining(`${id}.png`));
    }
    expect(screen.getByRole("heading", { name: "Language, Dialects & Multilingual AI" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quantitative Finance & Legal Analysis" })).toBeInTheDocument();
  });

  it("gives every audience benefit card its own illustrated thumbnail", () => {
    const { container } = render(<Pillars />);
    const thumbnails = Array.from(container.querySelectorAll<HTMLImageElement>(".q-aud__benefit-artwork"));
    const expected = [
      "expert-location", "expert-rubrics", "expert-payouts", "expert-feedback",
      "agency-contracts", "agency-batches", "agency-settlements", "agency-workspace",
      "enterprise-authorities", "enterprise-observability", "enterprise-timelines", "enterprise-value",
    ];

    expect(thumbnails).toHaveLength(expected.length);
    for (const [index, name] of expected.entries()) {
      expect(decodeURIComponent(thumbnails[index]?.getAttribute("src") ?? ""))
        .toContain(`/images/benefits/${name}.png`);
      expect(thumbnails[index]?.getAttribute("alt")).toBe("");
    }
    expect(container.querySelectorAll(".q-aud__benefits .q-aud__icon")).toHaveLength(0);
  });

  it("shows one audience at a time while keeping all three pillars in the page", () => {
    const { container } = render(<Pillars />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Experts", "Agencies", "Enterprises"]);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
    expect(container.querySelectorAll("h3")).toHaveLength(3);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Work Anywhere, Anytime.");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("No Algorithmic Bans");

    fireEvent.click(screen.getByRole("tab", { name: "Agencies" }));
    expect(screen.getByRole("tab", { name: "Agencies" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Big Projects from Frontier Labs.");
    expect(screen.getByRole("link", { name: /Apply for Agency Accreditation/ })).toHaveAttribute("href", "/register/vendor");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Agencies" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Enterprises" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Deploy Verified Domain Authorities");
    expect(screen.getByRole("link", { name: /Schedule an Enterprise Consultation/ })).toHaveAttribute("href", "/register/client");
  });

  it("keeps inactive panels hidden even though panels are laid out as grids", () => {
    expect(css("pillars.css")).toMatch(/\.q-aud__panel\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});

describe("glass box comparison", () => {
  it("keeps a semantic comparison table and toggles the highlighted model", () => {
    const { container } = render(<GlassBox />);
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Operational area",
      "Legacy crowdsourcing platforms",
      "The eQOURSE+ glass-box standard",
    ]);
    expect(screen.getAllByRole("rowheader")).toHaveLength(5);

    const legacy = screen.getByRole("button", { name: "Legacy platforms" });
    const standard = screen.getByRole("button", { name: "eQOURSE+ standard" });
    fireEvent.click(standard);
    expect(standard).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".q-gb")).toHaveAttribute("data-mode", "glass");
    fireEvent.click(legacy);
    expect(legacy).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".q-gb")).toHaveAttribute("data-mode", "legacy");
  });
});

describe("FAQ", () => {
  it("renders native, keyboard-operable disclosure items with the first open", () => {
    const { container } = render(<Faq />);
    const items = container.querySelectorAll("details");
    expect(items).toHaveLength(7);
    expect(items[0]).toHaveAttribute("open");
    expect(container.querySelectorAll("summary")).toHaveLength(7);
    expect(screen.getByText(/enterprise clients on real projects/i)).toBeInTheDocument();
    expect(screen.getByText(/which countries can experts work from/i)).toBeInTheDocument();
  });

  it("uses the approved answer wording", () => {
    render(<Faq />);
    expect(screen.getByText(/Expert opportunities span 30\+ languages/)).toBeInTheDocument();
    expect(screen.getByText(/milestone-based settlements/)).toBeInTheDocument();
  });

  it("wraps long questions and offsets anchored sections below the floating nav", () => {
    expect(faqCss).toMatch(/\.q-qa__q\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(heroCss).toMatch(/\.q-home section\[id\]\s*\{[^}]*scroll-margin-top/);
  });
});

describe("liquid glass", () => {
  it("falls back to frosted glass where refraction is unsupported", () => {
    expect(supportsBackdropRefraction()).toBe(false);
    const { container } = render(<LiquidGlass tier="focal">content</LiquidGlass>);
    const glass = container.firstElementChild!;
    expect(glass).toHaveClass("q-glass");
    expect(glass).toHaveAttribute("data-glass", "frosted");
    expect(glass).toHaveAttribute("data-tier", "focal");
    expect(glass.querySelector("filter")).toBeNull();
  });

  it("concentrates Snell's-law bending on the squircle rim", () => {
    expect(squircle(0)).toBe(0);
    expect(squircle(1)).toBe(1);
    const { values, max } = displacementProfile(DEFAULT_OPTICS);
    const mean = (list: Float32Array) => list.reduce((sum, value) => sum + value, 0) / list.length;
    const third = Math.floor(values.length / 3);
    expect(max).toBeGreaterThan(0);
    // the steep outer bezel bends far more than the part near the flat face
    expect(mean(values.slice(0, third))).toBeGreaterThan(mean(values.slice(-third)) * 2);
    // where the bezel meets the flat face, rays pass straight through
    expect(rayDisplacement(0.999, DEFAULT_OPTICS)).toBeLessThan(max * 0.1);
  });

  it("encodes horizontal bend in R, vertical in G, neutral outside the lens", () => {
    const width = 200;
    const height = 100;
    const { pixels, width: w, height: h, scale } = buildRefractionPixels(width, height, 30);
    const at = (x: number, y: number) => pixels.slice((y * w + x) * 4, (y * w + x) * 4 + 4);
    expect(scale).toBeGreaterThan(0);
    // flat centre is neutral
    expect(Array.from(at(Math.floor(w / 2), Math.floor(h / 2)).slice(0, 2))).toEqual([128, 128]);
    // outside the rounded corner is neutral
    expect(Array.from(at(0, 0).slice(0, 2))).toEqual([128, 128]);
    // rims sample inward: right edge pulls left (R < 128), left edge pulls right
    const mid = Math.floor(h / 2);
    expect(at(w - 3, mid)[0]).toBeLessThan(128);
    expect(at(2, mid)[0]).toBeGreaterThan(128);
    expect(at(w - 3, mid)[1]).toBe(128);
    // bottom edge pulls up through G
    expect(at(Math.floor(w / 2), h - 3)[1]).toBeLessThan(128);
  });
});

describe("design system", () => {
  it.each([
    ["light", ':root,\n[data-theme="light"]'],
    ["dark", '[data-theme="dark"]'],
  ] as const)("keeps %s text and brand tokens AA against the page background", (_theme, selector) => {
    const block = themeBlock(selector);
    const bg = token(block, "q-bg");
    expect(contrast(token(block, "q-ink"), bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(token(block, "q-ink-2"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(block, "q-ink-3"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(block, "q-brand-ink"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(block, "q-on-brand"), token(block, "q-brand"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(block, "q-on-brand"), token(block, "q-brand-2"))).toBeGreaterThanOrEqual(4.5);
  });

  it("rests every animation and reveals all content under reduced motion", () => {
    const reduced = landingCss.slice(landingCss.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(reduced).toMatch(/\.q-js \.q-reveal\s*\{[^}]*opacity:\s*1/);
  });

  it("only hides reveal content once JavaScript has marked the document", () => {
    expect(landingCss).toMatch(/\.q-js \.q-reveal\s*\{[^}]*opacity:\s*0/);
    expect(landingCss).not.toMatch(/(^|\n)\.q-reveal\s*\{[^}]*opacity:\s*0/);
  });

  it("keeps 48px touch targets on the nav toggle, theme switch, buttons and search controls", () => {
    expect(chromeCss).toMatch(/\.q-nav__toggle\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px/);
    expect(chromeCss).toMatch(/\.q-theme\s*\{[^}]*height:\s*48px/);
    expect(landingCss).toMatch(/\.q-btn\s*\{[^}]*min-height:\s*3rem/);
    expect(chromeCss).toMatch(/\.q-footer__cta\s*\{[^}]*min-height:\s*48px/);
    expect(tracksCss).toMatch(/\.q-dm__clear\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px/);
    expect(tracksCss).toMatch(/\.q-dm__example\s*\{[^}]*min-height:\s*40px/);
  });
});
