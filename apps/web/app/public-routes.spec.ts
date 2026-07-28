import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { RESOLVING_ROUTES, UNBUILT_ROUTES } from "./public-routes";

function pagePath(route: string) {
  return route === "/"
    ? resolve(process.cwd(), "app/page.tsx")
    : resolve(process.cwd(), `app${route}/page.tsx`);
}

describe("public route registry", () => {
  it("keeps resolving and unbuilt routes disjoint", () => {
    expect(
      RESOLVING_ROUTES.filter((route) => UNBUILT_ROUTES.includes(route)),
    ).toEqual([]);
  });

  it("lists a route as resolving only when its page exists", () => {
    for (const route of RESOLVING_ROUTES) {
      expect(existsSync(pagePath(route)), `${route} page.tsx`).toBe(true);
    }
  });
});
