import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EXCLUDED_ROUTES,
  RESOLVING_ROUTES,
  UNBUILT_ROUTES,
} from "./public-routes";

const ALL_PUBLIC_ROUTES = [
  "/",
  "/about",
  "/company-reviews",
  "/dashboard",
  "/design-system",
  "/freelancers",
  "/jobs",
  "/login",
  "/profile",
  "/register",
  "/register/client",
  "/register/freelancer",
  "/register/vendor",
  "/vendors",
] as const;

function pagePaths(route: string): string[] {
  const directPath = route === "/"
    ? resolve(process.cwd(), "app/page.tsx")
    : resolve(process.cwd(), `app${route}/page.tsx`);
  const authenticatedPath = resolve(
    process.cwd(),
    `app/(authenticated)${route}/page.tsx`,
  );
  return [directPath, authenticatedPath];
}

function routePageExists(route: string): boolean {
  return pagePaths(route).some((path) => existsSync(path));
}

describe("public route registry", () => {
  it("preserves the frozen union of all public routes", () => {
    expect(
      [...RESOLVING_ROUTES, ...EXCLUDED_ROUTES, ...UNBUILT_ROUTES].sort(),
    ).toEqual([...ALL_PUBLIC_ROUTES]);
  });

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

  it("keeps registration out of the sitemap source", () => {
    expect(EXCLUDED_ROUTES).toContain("/register/vendor");
    expect(EXCLUDED_ROUTES).toContain("/register/client");
    expect(RESOLVING_ROUTES).not.toContain("/register/vendor");
    expect(RESOLVING_ROUTES).not.toContain("/register/client");
  });

  it("keeps the authenticated verification console excluded and out of the sitemap", () => {
    expect(EXCLUDED_ROUTES).toContain("/company-reviews");
    expect(RESOLVING_ROUTES).not.toContain("/company-reviews");
  });

  it("keeps the authenticated role home excluded and out of the sitemap", () => {
    expect(EXCLUDED_ROUTES).toContain("/dashboard");
    expect(RESOLVING_ROUTES).not.toContain("/dashboard");
  });

  it("keeps the authenticated profile wizard excluded and out of the sitemap", () => {
    expect(EXCLUDED_ROUTES).toContain("/profile");
    expect(RESOLVING_ROUTES).not.toContain("/profile");
  });

  it("lists a route as resolving only when its page exists", () => {
    for (const route of RESOLVING_ROUTES) {
      expect(routePageExists(route), `${route} page.tsx`).toBe(true);
    }
  });

  it("lists a route as unbuilt only when its page does not exist", () => {
    for (const route of UNBUILT_ROUTES) {
      expect(routePageExists(route), `${route} page.tsx`).toBe(false);
    }
  });

  it("lists an excluded route only when its page exists", () => {
    for (const route of EXCLUDED_ROUTES) {
      expect(routePageExists(route), `${route} page.tsx`).toBe(true);
    }
  });
});
