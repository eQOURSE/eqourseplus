import { beforeEach, describe, expect, it } from "vitest";

import {
  acquireRefractionSlot,
  releaseRefractionSlot,
  resetRefractionBudgetForTests,
  resolveGlassTier,
} from "../src/glass/capabilities";
import { getNextSegmentIndex } from "../src/glass/segmented-control";
import { designTokens } from "../src/tokens";

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
      specularMaxAlpha: 0.25,
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
