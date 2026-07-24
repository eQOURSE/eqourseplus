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

describe("FR-PUB-00A refraction intensity", () => {
  const rimDelta = (pixels: Uint8ClampedArray, width: number, x: number, y: number) =>
    Math.abs((pixels[(y * width + x) * 4] ?? 128) - 128);

  it("bends at least 100/128 at the lens rim so refraction is obvious", () => {
    const width = 32;
    const height = 32;
    const pixels = createDisplacementPixels({ width, height });

    expect(rimDelta(pixels, width, 1, Math.floor(height / 2) - 1)).toBeGreaterThanOrEqual(100);
  });

  it("keeps the lens center neutral so foreground copy stays readable", () => {
    const width = 32;
    const height = 32;
    const pixels = createDisplacementPixels({ width, height });
    const center = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;

    expect(pixels[center]).toBe(128);
    expect(pixels[center + 1]).toBe(128);
  });

  it("concentrates the bend harder at the rim as curvature increases", () => {
    const width = 32;
    const height = 32;
    const midLensX = 5;
    const midLensY = Math.floor(height / 2) - 1;
    const softer = createDisplacementPixels({ width, height, curvature: 40 });
    const harder = createDisplacementPixels({ width, height, curvature: 90 });

    expect(rimDelta(harder, width, midLensX, midLensY)).toBeLessThan(
      rimDelta(softer, width, midLensX, midLensY),
    );
    expect(rimDelta(harder, width, 1, midLensY)).toBeGreaterThanOrEqual(100);
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
