import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it } from "vitest";

import {
  acquireRefractionSlot,
  releaseRefractionSlot,
  resetRefractionBudgetForTests,
  resolveGlassTier,
} from "../src/glass/capabilities";
import { getNextSegmentIndex } from "../src/glass/segmented-control";
import { designTokens } from "../src/tokens";

const glassSource = readFileSync(
  new URL("../src/components/glass.tsx", import.meta.url),
  "utf8",
);
const stylesSource = readFileSync(
  new URL("../src/styles.css", import.meta.url),
  "utf8",
);

const supportedEnvironment = {
  isBrowser: true,
  supportsSvgFilters: true,
  supportsCanvas2d: true,
  prefersReducedMotion: false,
  isLowEndDevice: false,
  disabled: false,
  width: 320,
  height: 72,
};

describe("FR-PUB-00A segmented-control selection logic", () => {
  it.each([
    ["ArrowRight", 0, 1],
    ["ArrowDown", 1, 2],
    ["ArrowRight", 2, 0],
    ["ArrowLeft", 0, 2],
    ["ArrowUp", 2, 1],
    ["Home", 2, 0],
    ["End", 0, 2],
  ] as const)(
    "handles %s from index %i",
    (key, currentIndex, expectedIndex) => {
      expect(getNextSegmentIndex(key, currentIndex, 3)).toBe(expectedIndex);
    },
  );

  it("ignores unrelated keys and empty option collections", () => {
    expect(getNextSegmentIndex("Enter", 1, 3)).toBe(1);
    expect(getNextSegmentIndex("ArrowRight", 0, 0)).toBe(0);
  });
});

describe("FR-PUB-00A focal budget fallback", () => {
  beforeEach(() => {
    resetRefractionBudgetForTests();
  });

  it("forces the fourth simultaneous focal candidate to frosted", () => {
    const slots = [
      acquireRefractionSlot(),
      acquireRefractionSlot(),
      acquireRefractionSlot(),
      acquireRefractionSlot(),
    ];

    expect(
      slots.map((slot) =>
        resolveGlassTier({
          ...supportedEnvironment,
          hasRefractionSlot: slot !== null,
        }),
      ),
    ).toEqual(["refraction", "refraction", "refraction", "frosted"]);

    slots.forEach(releaseRefractionSlot);
  });
});

describe("FR-PUB-00A exact DESIGN.md section 13 tokens", () => {
  it("publishes only the authorized ambient colors and glass values", () => {
    expect(designTokens.glass).toEqual({
      regular: {
        light: "rgba(255,255,255,0.55)",
        dark: "rgba(35,45,70,0.45)",
        blur: "18px",
      },
      clear: {
        light: "rgba(255,255,255,0.25)",
        dark: "rgba(35,45,70,0.25)",
        blur: "8px",
      },
      focal: {
        blur: "24px",
      },
      specularMaxAlpha: 0.4,
      rimMaxAlpha: 0.18,
    });
    expect(designTokens.ambient).toEqual({
      teal: "#0F9B8E",
      mint: "#7BE8C9",
      navy: "#232145",
      skyBlue: "#38bdf8",
      teal300: "#5eead4",
    });
    expect(designTokens.motion.easings.gelPress).toBe(
      "cubic-bezier(0.5, 1.8, 0.4, 0.9)",
    );
  });
});

describe("FR-PUB-00A focal lens rim and chroma polish", () => {
  it("keeps the accent rim at or below the section 13 alpha cap", () => {
    const rimAlpha = stylesSource.match(
      /--glass-rim:\s*hsl\(var\(--accent\)\s*\/\s*([\d.]+)\)/,
    )?.[1];

    expect(rimAlpha).toBeDefined();
    expect(Number(rimAlpha)).toBeLessThanOrEqual(0.18);
  });

  it("keeps the white specular within the polished bounds", () => {
    const cssAlpha = stylesSource.match(
      /--glass-specular:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/,
    )?.[1];
    const specularConstant = glassSource.match(
      /specularConstant="([\d.]+)"/,
    )?.[1];
    const specularExponent = glassSource.match(
      /specularExponent="([\d.]+)"/,
    )?.[1];

    expect(Number(cssAlpha)).toBeGreaterThanOrEqual(0.35);
    expect(Number(cssAlpha)).toBeLessThanOrEqual(0.4);
    expect(Number(specularConstant)).toBeGreaterThanOrEqual(0.4);
    expect(Number(specularConstant)).toBeLessThanOrEqual(0.45);
    expect(Number(specularExponent)).toBeGreaterThanOrEqual(20);
    expect(Number(specularExponent)).toBeLessThanOrEqual(24);
    expect(stylesSource).toMatch(
      /\[data-glass-visual-tier="focal"\][\s\S]*?inset 0 0 0 0\.5px rgba\(255,\s*255,\s*255,\s*0\.35\)/,
    );
  });

  it("uses only the primary teal and accent mint for the chroma fringe", () => {
    const fringeColors = Array.from(
      glassSource.matchAll(/floodColor="(#[\dA-Fa-f]{6})"/g),
      (match) => match[1],
    );
    const fringeOffsets = Array.from(
      glassSource.matchAll(
        /<feOffset[\s\S]*?dx="(-?[\d.]+)"[\s\S]*?result="(?:primary|accent)-offset"/g,
      ),
      (match) => Math.abs(Number(match[1])),
    );

    expect(fringeColors).toEqual([
      designTokens.colors.primary.hex,
      designTokens.colors.accent.hex,
    ]);
    expect(fringeOffsets).toEqual([3.1, 3.1]);
  });
});
