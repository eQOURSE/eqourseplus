import { NAV_LINKS } from "./HomeChrome";

export { PUBLIC_CHROME_HREFS } from "./HomeChrome";

const CHROME_SELECTORS = ["#site-navigation", "#home-mobile-navigation", "#site-footer"];

/** Visible text of a rendered page with the shared public chrome removed. */
export function pageBodyText(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  for (const selector of CHROME_SELECTORS) {
    clone.querySelectorAll(selector).forEach((node) => node.remove());
  }
  clone.querySelectorAll("script").forEach((node) => node.remove());
  return clone.textContent ?? "";
}

/** Elements matching `selector` that sit outside the shared public chrome. */
export function inPageBody<T extends Element>(container: HTMLElement, selector: string): T[] {
  return Array.from(container.querySelectorAll<T>(selector)).filter(
    (node) => !CHROME_SELECTORS.some((chrome) => node.closest(chrome)),
  );
}

export function primaryNavHrefs(container: HTMLElement): Array<string | null> {
  return Array.from(
    container.querySelectorAll<HTMLAnchorElement>("#site-navigation .q-nav__links a"),
    (link) => link.getAttribute("href"),
  );
}

export const PRIMARY_NAV_HREFS = NAV_LINKS.map((link) => link.href);

/**
 * Drops ISO standard designations (e.g. "ISO 9001:2015", "ISO/IEC 27001")
 * so "no unsupported numbers" checks still catch every other digit,
 * including in the shared footer's approved certification notice.
 */
export function withoutStandardIds(text: string): string {
  return text.replace(/\bISO(?:\/IEC)?\s?\d{4,5}(?::\d{4})?/g, "ISO");
}
