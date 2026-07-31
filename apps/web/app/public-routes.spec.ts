import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EXCLUDED_ROUTES,
  RESOLVING_ROUTES,
  UNBUILT_ROUTES,
} from "./public-routes";

function pagePath(route: string) {
  return route === "/"
    ? resolve(process.cwd(), "app/page.tsx")
    : resolve(process.cwd(), `app${route}/page.tsx`);
}

describe("public route registry", () => {
  it("keeps resolving, excluded, and unbuilt routes mutually disjoint", () => {
    const registries: readonly (readonly string[])[] = [
      RESOLVING_ROUTES,
      EXCLUDED_ROUTES,
      UNBUILT_ROUTES,
    ];

    for (let left = 0; left < registries.length; left += 1) {
      for (let right = left + 1; right < registries.length; right += 1) {
        expect(
          registries[left]?.filter((route) =>
            registries[right]?.includes(route),
          ),
        ).toEqual([]);
      }
    }
  });

  it("lists a route as resolving only when its page exists", () => {
    for (const route of RESOLVING_ROUTES) {
      expect(existsSync(pagePath(route)), `${route} page.tsx`).toBe(true);
    }
  });

  it("lists a route as unbuilt only when its page does not exist", () => {
    for (const route of UNBUILT_ROUTES) {
      expect(existsSync(pagePath(route)), `${route} page.tsx`).toBe(false);
    }
  });

  it("lists an excluded route only when its page exists", () => {
    for (const route of EXCLUDED_ROUTES) {
      expect(existsSync(pagePath(route)), `${route} page.tsx`).toBe(true);
    }
  });
});
