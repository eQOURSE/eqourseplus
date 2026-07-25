import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";

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
const buttonSource = readFileSync(
  new URL("../src/components/glass-button.tsx", import.meta.url),
  "utf8",
);
const substratePath = new URL(
  "../src/components/glass-substrate.tsx",
  import.meta.url,
);
const substrateSource = existsSync(substratePath)
  ? readFileSync(substratePath, "utf8")
  : "";

function readSourceTree(directory: URL): string {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = new URL(`${entry}${statSync(new URL(entry, directory)).isDirectory() ? "/" : ""}`, directory);
      return statSync(path).isDirectory()
        ? readSourceTree(path)
        : /\.(?:ts|tsx|css)$/.test(entry)
          ? [readFileSync(path, "utf8")]
          : [];
    })
    .join("\n");
}

const uiSource = readSourceTree(new URL("../src/", import.meta.url));

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
        light:
          "linear-gradient(180deg,rgba(255,255,255,0.34) 0%,rgba(255,255,255,0.10) 45%,rgba(255,255,255,0.22) 100%)",
        dark:
          "linear-gradient(180deg,rgba(255,255,255,0.13) 0%,rgba(35,45,70,0.20) 45%,rgba(255,255,255,0.07) 100%)",
        blur: "14px",
      },
      clear: {
        light: "rgba(255,255,255,0.25)",
        dark: "rgba(35,45,70,0.25)",
        blur: "8px",
      },
      focal: {
        blur: "4px",
        light:
          "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))",
        dark:
          "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(35,45,70,0.14))",
      },
      specularMaxAlpha: 0.4,
      hairlineMaxAlpha: 0.95,
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

  it("keeps the white specular wash and hairline within the polished bounds", () => {
    const washAlpha = Number(
      stylesSource.match(
        /--glass-specular:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/,
      )?.[1],
    );
    const hairlineAlpha = Number(
      stylesSource.match(
        /--glass-bezel-hairline:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/,
      )?.[1],
    );

    expect(washAlpha).toBeLessThanOrEqual(0.4);
    expect(hairlineAlpha).toBeLessThanOrEqual(0.95);
    expect(glassSource).not.toContain("<feSpecularLighting");
    expect(glassSource).not.toContain("<fePointLight");
  });

  it("uses optical per-channel separation instead of a painted fringe", () => {
    expect(glassSource.match(/<feDisplacementMap/g)).toHaveLength(3);
    expect(glassSource.match(/result="disp-[rgb]"/g)).toHaveLength(3);
    expect(glassSource).not.toContain("<feOffset");
    expect(glassSource).not.toContain('floodColor="#0F9B8E"');
    expect(glassSource).not.toContain('floodColor="#7BE8C9"');
  });
});

describe("FR-PUB-00B material and palette guards", () => {
  it("rebalances ambient intensity per theme and uses it in both drift keyframes", () => {
    expect(stylesSource).toMatch(/--ambient-opacity-rest:\s*0\.18;/);
    expect(stylesSource).toMatch(/--ambient-opacity-peak:\s*0\.26;/);
    expect(stylesSource).toMatch(
      /\[data-theme="dark"\][\s\S]*?--ambient-opacity-rest:\s*0\.30;/,
    );
    expect(stylesSource).toMatch(
      /\[data-theme="dark"\][\s\S]*?--ambient-opacity-peak:\s*0\.42;/,
    );
    expect(stylesSource).toMatch(
      /\.eq-ambient-canvas__blob\s*\{[\s\S]*?filter:\s*blur\(80px\);[\s\S]*?opacity:\s*var\(--ambient-opacity-rest\)/,
    );
    expect(
      stylesSource.match(/opacity:\s*var\(--ambient-opacity-rest\)/g),
    ).toHaveLength(3);
    expect(
      stylesSource.match(/opacity:\s*var\(--ambient-opacity-peak\)/g),
    ).toHaveLength(2);
    expect(stylesSource).toMatch(
      /\.eq-ambient-canvas__blob--teal\s*\{[\s\S]*?width:\s*30rem;[\s\S]*?height:\s*30rem;/,
    );
    expect(stylesSource).toMatch(
      /\.eq-ambient-canvas__blob--navy\s*\{[\s\S]*?width:\s*30rem;[\s\S]*?height:\s*30rem;/,
    );
  });

  it("keeps the decorative ambient canvas outside document layout", () => {
    expect(stylesSource).toMatch(
      /\.eq-liquid-glass-demo\s*>\s*\.eq-ambient-canvas\s*\{[\s\S]*?position:\s*fixed/,
    );
  });

  it("keeps focal glass clear, neutral, and within section 13 caps", () => {
    const focalBlur = Number(
      stylesSource.match(/--glass-focal-blur:\s*([\d.]+)px/)?.[1],
    );
    const focalTintAlphas = Array.from(
      stylesSource.matchAll(
        /--glass-focal-tint:[^;]*?rgba\((?:255,\s*255,\s*255|35,\s*45,\s*70),\s*([\d.]+)\)/g,
      ),
      (match) => Number(match[1]),
    );
    const rimAlpha = Number(
      stylesSource.match(
        /--glass-rim:\s*hsl\(var\(--accent\)\s*\/\s*([\d.]+)\)/,
      )?.[1],
    );
    const hairlineAlpha = Number(
      stylesSource.match(
        /--glass-bezel-hairline:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/,
      )?.[1],
    );
    const mintSweepAlpha = Number(
      stylesSource.match(/--glass-bezel-mint-sweep-alpha:\s*([\d.]+)/)?.[1],
    );

    expect(focalBlur).toBeLessThanOrEqual(6);
    expect(focalTintAlphas.length).toBeGreaterThan(0);
    expect(Math.max(...focalTintAlphas)).toBeLessThanOrEqual(0.14);
    expect(rimAlpha).toBeLessThanOrEqual(0.18);
    expect(hairlineAlpha).toBeLessThanOrEqual(0.95);
    expect(mintSweepAlpha).toBeLessThanOrEqual(0.35);
    expect(stylesSource).toMatch(
      /inset 0 1px 0\.5px var\(--glass-bezel-hairline\)/,
    );
    expect(stylesSource).toMatch(
      /inset 0 0 0 1\.5px hsl\(var\(--accent\) \/ 0\.18\)/,
    );
  });

  it("uses contrast-safe substrate alphas and only tokenized brand hues", () => {
    const substrateBlock = stylesSource.match(
      /(?:^|\n)\.eq-glass-substrate\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    const alphas = Array.from(
      substrateBlock?.matchAll(
        /hsl\(var\(--(?:primary|accent)\)\s*\/\s*([\d.]+)\)/g,
      ) ?? [],
      (match) => Number(match[1]),
    );

    expect(alphas).toEqual([0.06, 0.06, 0.08, 0.08]);
    expect(Math.max(...alphas)).toBeLessThanOrEqual(0.16);
    expect(substrateBlock).not.toMatch(/blur\(/);
    expect(substrateSource).toContain('aria-hidden="true"');
    expect(stylesSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.eq-glass-substrate[\s\S]*?animation:\s*none/,
    );
    expect(stylesSource).toMatch(/--substrate-mask-floor:\s*0\.34;/);
    expect(substrateBlock).toMatch(
      /mask-image:[\s\S]*?hsl\(0 0% 0% \/ var\(--substrate-mask-floor\)\)\s*100%/,
    );
    expect(substrateBlock).not.toMatch(/transparent\s+(?:72|100)%/);
  });

  it("keeps regular and clear tiers in the same neutral hue family", () => {
    const lightRegular = stylesSource.match(
      /--glass-regular:\s*(linear-gradient\([\s\S]*?\));\s*--glass-regular-blur/,
    )?.[1];
    const lightClear = stylesSource.match(
      /--glass-clear:\s*(rgba\([^)]+\));/,
    )?.[1];
    const darkStart = stylesSource.indexOf('[data-theme="dark"]');
    const darkBlock = stylesSource.slice(
      darkStart,
      stylesSource.indexOf("\n.eq-frosted", darkStart),
    );
    const darkRegular = darkBlock.match(
      /--glass-regular:\s*(linear-gradient\([\s\S]*?\));\s*--glass-clear/,
    )?.[1];
    const darkClear = darkBlock.match(
      /--glass-clear:\s*(rgba\([^)]+\));/,
    )?.[1];
    const regularAlphas = Array.from(
      lightRegular?.matchAll(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/g) ?? [],
      (match) => Number(match[1]),
    );

    expect(lightRegular).toMatch(
      /^linear-gradient\([^;]*rgba\(255,\s*255,\s*255,/,
    );
    expect(lightClear).toMatch(/^rgba\(255,\s*255,\s*255,/);
    expect(darkRegular).toMatch(
      /rgba\((?:255,\s*255,\s*255|35,\s*45,\s*70),/,
    );
    expect(darkClear).toMatch(/^rgba\(35,\s*45,\s*70,/);
    expect(regularAlphas).not.toContain(0.25);
    expect(stylesSource).toContain("--glass-regular-blur: 14px;");
    expect(stylesSource).toContain("--glass-clear-blur: 8px;");
    expect(stylesSource).toMatch(
      /\.eq-glass-tier-comparison::before\s*\{[\s\S]*?background:\s*hsl\(var\(--background\) \/ 0\.24\)/,
    );
  });

  it("amplifies frosted transmission without exceeding section 13", () => {
    const regularBackdrop = stylesSource.match(
      /\.eq-glass-tier-regular\s*\{[\s\S]*?backdrop-filter:[^;]+;/,
    )?.[0];
    const saturation = Number(
      regularBackdrop?.match(/saturate\(([\d.]+)\)/)?.[1],
    );
    const brightness = Number(
      regularBackdrop?.match(/brightness\(([\d.]+)\)/)?.[1],
    );

    expect(saturation).toBeGreaterThanOrEqual(1.6);
    expect(saturation).toBeLessThanOrEqual(1.9);
    expect(brightness).toBeGreaterThanOrEqual(1.04);
    expect(brightness).toBeLessThanOrEqual(1.1);
  });

  it("keeps brand and ambient values byte-identical to 69f67d4", () => {
    expect(stylesSource).toContain("--brand-teal: 170 82% 32%;");
    expect(stylesSource).toContain("--brand-mint: 165 75% 71%;");
    expect(stylesSource).toContain("--brand-navy: 242 33% 20%;");
    expect(stylesSource).toContain("--ambient-teal: #0F9B8E;");
    expect(stylesSource).toContain("--ambient-mint: #7BE8C9;");
    expect(stylesSource).toContain("--ambient-navy: #232145;");
    expect(stylesSource).toContain("--ambient-sky-blue: #38bdf8;");
    expect(stylesSource).toContain("--ambient-teal-300: #5eead4;");
  });

  it("introduces no colour literal outside the 69f67d4 palette baseline", () => {
    const baselineHex = new Set([
      "#000",
      "#000000",
      "#0F9B8E",
      "#232145",
      "#38bdf8",
      "#5eead4",
      "#63607A",
      "#7BE8C9",
      "#E0E8E4",
      "#EEF5F2",
      "#EF4444",
      "#F2F5F4",
      "#F7FAF9",
      "#FFFFFF",
    ]);
    const hexLiterals = uiSource.match(/#[\dA-Fa-f]{3,8}\b/g) ?? [];
    const rgbLiterals = uiSource.match(/rgba?\([^)]*\)/g) ?? [];

    for (const literal of hexLiterals) {
      expect(baselineHex.has(literal), literal).toBe(true);
    }
    for (const literal of rgbLiterals) {
      expect(
        /rgba\((?:255,\s*255,\s*255|35,\s*45,\s*70),\s*[\d.]+\)/.test(
          literal,
        ) || literal === "rgb(128,128,128)",
        literal,
      ).toBe(true);
    }
  });

  it("keeps every glass fill neutral and reserves brand hue for transmitted plates", () => {
    const fillDeclarations = Array.from(
      stylesSource.matchAll(
        /--glass-(?:regular|clear|focal-tint):\s*([^;]+);/g,
      ),
      (match) => match[1],
    );

    expect(fillDeclarations.length).toBeGreaterThanOrEqual(3);
    for (const fill of fillDeclarations) {
      expect(fill).not.toMatch(/var\(--(?:primary|accent)\)/);
      expect(fill).toMatch(/rgba\((?:255,\s*255,\s*255|35,\s*45,\s*70),/);
    }
    expect(stylesSource).toContain(
      "--glass-plate-primary: linear-gradient(135deg, hsl(170 82% 26%), hsl(174 72% 20%));",
    );
  });

  it("adds all button variants and their interaction states", () => {
    expect(buttonSource).toContain(
      'export type GlassButtonVariant = "primary" | "secondary" | "ghost"',
    );
    expect(buttonSource).toMatch(/variant\s*=\s*"secondary"/);

    for (const variant of ["primary", "secondary", "ghost"]) {
      expect(buttonSource).toContain(`eq-glass-button--\${variant}`);
      expect(stylesSource).toContain(`.eq-glass-button--${variant}:hover`);
      expect(stylesSource).toContain(`.eq-glass-button--${variant}:active`);
      expect(stylesSource).toContain(
        `.eq-glass-button--${variant}:focus-visible`,
      );
      expect(stylesSource).toContain(
        `.eq-glass-button--${variant}[disabled]`,
      );
    }
  });

  it("uses the paper token on a reading surface", () => {
    expect(stylesSource).toContain("--paper: 160 30% 98%;");
    expect(stylesSource).toMatch(
      /(?:background|background-color):\s*hsl\(var\(--paper\)\)/,
    );
  });
});
