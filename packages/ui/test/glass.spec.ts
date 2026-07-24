import { beforeEach, describe, expect, it } from "vitest";

import {
  acquireRefractionSlot,
  releaseRefractionSlot,
  resetRefractionBudgetForTests,
  resolveGlassTier,
} from "../src/glass/capabilities";
import { createDisplacementPixels } from "../src/glass/displacement-map";

const supportedEnvironment = {
  isBrowser: true,
  supportsSvgFilters: true,
  supportsCanvas2d: true,
  prefersReducedMotion: false,
  isLowEndDevice: false,
  disabled: false,
  width: 480,
  height: 280,
  hasRefractionSlot: true,
};

describe("FR-PUB-00 glass progressive enhancement", () => {
  it("keeps SSR and explicitly disabled glass frosted", () => {
    expect(
      resolveGlassTier({ ...supportedEnvironment, isBrowser: false }),
    ).toBe("frosted");
    expect(
      resolveGlassTier({ ...supportedEnvironment, disabled: true }),
    ).toBe("frosted");
  });

  it.each([
    ["unsupported SVG filters", { supportsSvgFilters: false }],
    ["missing canvas", { supportsCanvas2d: false }],
    ["reduced motion", { prefersReducedMotion: true }],
    ["a low-end device", { isLowEndDevice: true }],
    ["an exhausted focal-element budget", { hasRefractionSlot: false }],
    ["an oversized source width", { width: 721 }],
    ["an oversized source height", { height: 481 }],
  ])("falls back for %s", (_reason, override) => {
    expect(
      resolveGlassTier({ ...supportedEnvironment, ...override }),
    ).toBe("frosted");
  });

  it("enables refraction only when every enhancement gate passes", () => {
    expect(resolveGlassTier(supportedEnvironment)).toBe("refraction");
  });
});

describe("FR-PUB-00 refraction focal-element budget", () => {
  beforeEach(() => {
    resetRefractionBudgetForTests();
  });

  it("reserves refraction for at most three simultaneous elements", () => {
    const first = acquireRefractionSlot();
    const second = acquireRefractionSlot();
    const third = acquireRefractionSlot();

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();
    expect(acquireRefractionSlot()).toBeNull();

    releaseRefractionSlot(second);
    expect(acquireRefractionSlot()).not.toBeNull();
  });
});

describe("FR-PUB-00 quarter-map displacement symmetry", () => {
  it("keeps the outside neutral and mirrors X/Y displacement around the lens", () => {
    const width = 12;
    const height = 8;
    const pixels = createDisplacementPixels({ width, height });
    const channel = (x: number, y: number, offset: number) =>
      pixels[(y * width + x) * 4 + offset];

    expect(channel(0, 0, 0)).toBe(128);
    expect(channel(0, 0, 1)).toBe(128);

    const x = 2;
    const y = 2;
    const mirroredX = width - 1 - x;
    const mirroredY = height - 1 - y;

    expect((channel(x, y, 0) ?? 128) - 128).toBe(
      -((channel(mirroredX, y, 0) ?? 128) - 128),
    );
    expect((channel(x, y, 1) ?? 128) - 128).toBe(
      (channel(mirroredX, y, 1) ?? 128) - 128,
    );
    expect((channel(x, y, 0) ?? 128) - 128).toBe(
      (channel(x, mirroredY, 0) ?? 128) - 128,
    );
    expect((channel(x, y, 1) ?? 128) - 128).toBe(
      -((channel(x, mirroredY, 1) ?? 128) - 128),
    );
  });
});
