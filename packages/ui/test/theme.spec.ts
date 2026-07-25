import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  THEME_STORAGE_KEY,
  persistTheme,
  resolveTheme,
} from "../src/theme/resolution";

const stylesSource = readFileSync(
  new URL("../src/styles.css", import.meta.url),
  "utf8",
);

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function declarations(block: string) {
  return Object.fromEntries(
    Array.from(
      block.matchAll(/--([\w-]+):\s*([^;]+);/g),
      (match) => [match[1], match[2].trim()],
    ),
  );
}

function themeDeclarations(theme: "light" | "dark") {
  const lightStart = stylesSource.indexOf(":root,");
  const darkStart = stylesSource.indexOf('[data-theme="dark"]');
  const light = declarations(stylesSource.slice(lightStart, darkStart));
  if (theme === "light") {
    return light;
  }

  const darkEnd = stylesSource.indexOf("\n.eq-frosted", darkStart);
  return {
    ...light,
    ...declarations(stylesSource.slice(darkStart, darkEnd)),
  };
}

function resolveToken(tokens: Record<string, string>, name: string): string {
  const value = tokens[name];
  if (!value) {
    return "";
  }
  const reference = value.match(/^var\(--([\w-]+)\)$/)?.[1];
  return reference ? resolveToken(tokens, reference) : value;
}

function parseHsl(value: string): Hsl {
  const match = value.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) {
    throw new Error(`Expected an HSL triplet, received "${value}"`);
  }
  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = h / 60;
  const x = chroma * (1 - Math.abs((sector % 2) - 1));
  const [red, green, blue] =
    sector < 1
      ? [chroma, x, 0]
      : sector < 2
        ? [x, chroma, 0]
        : sector < 3
          ? [0, chroma, x]
          : sector < 4
            ? [0, x, chroma]
            : sector < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const offset = lightness - chroma / 2;
  return [red + offset, green + offset, blue + offset];
}

function relativeLuminance(rgb: [number, number, number]) {
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  ) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: Hsl, second: Hsl) {
  const firstLuminance = relativeLuminance(hslToRgb(first));
  const secondLuminance = relativeLuminance(hslToRgb(second));
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function composite(
  foreground: [number, number, number],
  alpha: number,
  background: [number, number, number],
): [number, number, number] {
  return foreground.map(
    (channel, index) =>
      channel * alpha + (background[index] ?? 0) * (1 - alpha),
  ) as [number, number, number];
}

function parseHex(value: string): [number, number, number] {
  const match = value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${value}"`);
  }
  return [match[1], match[2], match[3]].map(
    (channel) => Number.parseInt(channel, 16) / 255,
  ) as [number, number, number];
}

function contrastRgb(
  first: [number, number, number],
  second: [number, number, number],
) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function worstAmbientSurface(
  tokens: Record<string, string>,
  surfaceToken: "background" | "surface-sunken",
) {
  const surface = hslToRgb(parseHsl(resolveToken(tokens, surfaceToken)));
  const peak = Number(resolveToken(tokens, "ambient-opacity-peak"));
  let compositeSurface = surface;

  for (const ambientToken of [
    "ambient-teal",
    "ambient-mint",
    "ambient-navy",
    "ambient-sky-blue",
    "ambient-teal-300",
  ]) {
    compositeSurface = composite(
      parseHex(resolveToken(tokens, ambientToken)),
      peak,
      compositeSurface,
    );
  }

  const primary = hslToRgb(parseHsl(resolveToken(tokens, "primary")));
  const accent = hslToRgb(parseHsl(resolveToken(tokens, "accent")));
  const substrateFloor = Number(
    resolveToken(tokens, "substrate-mask-floor"),
  );
  for (const [color, alpha] of [
    [primary, 0.06],
    [primary, 0.06],
    [accent, 0.08],
    [primary, 0.08],
  ] as const) {
    compositeSurface = composite(
      color,
      alpha * substrateFloor,
      compositeSurface,
    );
  }

  return composite(
    surface,
    Number(resolveToken(tokens, "ambient-content-scrim")),
    compositeSurface,
  );
}

describe("FR-PUB-00 theme resolution", () => {
  it("defaults to light during SSR even when a dark system preference is supplied", () => {
    expect(
      resolveTheme({
        isServer: true,
        storedTheme: null,
        systemPrefersDark: true,
      }),
    ).toBe("light");
  });

  it("uses the system preference when there is no persisted override", () => {
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: null,
        systemPrefersDark: true,
      }),
    ).toBe("dark");
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: null,
        systemPrefersDark: false,
      }),
    ).toBe("light");
  });

  it("gives a valid persisted override precedence over the system preference", () => {
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: "light",
        systemPrefersDark: true,
      }),
    ).toBe("light");
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: "dark",
        systemPrefersDark: false,
      }),
    ).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: "sepia",
        systemPrefersDark: true,
      }),
    ).toBe("dark");
  });

  it("persists an explicit user theme under the stable storage key", () => {
    const storage = { setItem: vi.fn() };

    persistTheme(storage, "dark");

    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "dark");
  });
});

describe("FR-PUB-00B theme value ladders and contrast", () => {
  it("keeps the light and dark surface ladders monotonic", () => {
    const light = themeDeclarations("light");
    const dark = themeDeclarations("dark");
    const lightness = (tokens: Record<string, string>, name: string) =>
      parseHsl(resolveToken(tokens, name)).l;

    expect(lightness(light, "surface-sunken")).toBeLessThan(
      lightness(light, "background"),
    );
    expect(lightness(light, "background")).toBeLessThan(
      lightness(light, "card"),
    );
    expect(lightness(light, "card")).toBeLessThanOrEqual(
      lightness(light, "surface-elevated"),
    );
    expect(lightness(dark, "surface-sunken")).toBeLessThan(
      lightness(dark, "background"),
    );
    expect(lightness(dark, "background")).toBeLessThan(
      lightness(dark, "card"),
    );
    expect(lightness(dark, "card")).toBeLessThan(
      lightness(dark, "surface-elevated"),
    );
  });

  it("keeps dark card elevation and muted text distinct", () => {
    const dark = themeDeclarations("dark");

    expect(resolveToken(dark, "card")).not.toBe(
      resolveToken(dark, "background"),
    );
    expect(resolveToken(dark, "muted-foreground")).not.toBe(
      resolveToken(dark, "foreground"),
    );
  });

  it.each(["light", "dark"] as const)(
    "meets AA for every %s ladder text pair",
    (theme) => {
      const tokens = themeDeclarations(theme);
      for (const textToken of ["foreground", "muted-foreground"]) {
        for (const surfaceToken of [
          "surface-sunken",
          "background",
          "card",
          "surface-elevated",
        ]) {
          const ratio = contrast(
            parseHsl(resolveToken(tokens, textToken)),
            parseHsl(resolveToken(tokens, surfaceToken)),
          );
          expect(
            ratio,
            `${theme} ${textToken}/${surfaceToken}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );

  it("keeps light muted text AA at the worst substrate intersection", () => {
    const light = themeDeclarations("light");
    const muted = hslToRgb(
      parseHsl(resolveToken(light, "muted-foreground")),
    );
    const primary = hslToRgb(parseHsl(resolveToken(light, "primary")));
    const accent = hslToRgb(parseHsl(resolveToken(light, "accent")));
    let substrate = hslToRgb(
      parseHsl(resolveToken(light, "surface-sunken")),
    );

    for (const [color, alpha] of [
      [primary, 0.06],
      [primary, 0.06],
      [accent, 0.08],
      [primary, 0.08],
    ] as const) {
      substrate = composite(color, alpha, substrate);
    }

    const ratio =
      (Math.max(relativeLuminance(muted), relativeLuminance(substrate)) +
        0.05) /
      (Math.min(relativeLuminance(muted), relativeLuminance(substrate)) +
        0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("records the inherited primary gap and enforces the deep plate", () => {
    const white = parseHsl("0 0% 100%");
    const inheritedPrimary = parseHsl("170 82% 32%");
    const plateLight = parseHsl("170 82% 26%");
    const plateDark = parseHsl("174 72% 20%");

    expect(contrast(white, inheritedPrimary)).toBeCloseTo(3.76, 1);
    expect(contrast(white, inheritedPrimary)).toBeLessThan(4.5);
    expect(contrast(white, plateLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(white, plateDark)).toBeGreaterThanOrEqual(4.5);

    const worstRenderedStop = composite(
      hslToRgb(white),
      0.04,
      hslToRgb(plateLight),
    );
    expect(
      (relativeLuminance(hslToRgb(white)) + 0.05) /
        (relativeLuminance(worstRenderedStop) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps active segmented labels AA across both transmitted highlight stops", () => {
    const navy = parseHsl("242 33% 20%");
    const white = hslToRgb(parseHsl("0 0% 100%"));
    const stops = [
      [parseHsl("170 82% 32%"), 0.55],
      [parseHsl("165 75% 71%"), 0.75],
    ] as const;

    for (const base of [
      parseHsl("168 22% 88%"),
      parseHsl("242 30% 5%"),
    ]) {
      for (const [stop, alpha] of stops) {
        const transmitted = composite(
          hslToRgb(stop),
          alpha,
          hslToRgb(base),
        );
        const neutralOverlay = composite(white, 0.4, transmitted);
        expect(
          (Math.max(
            relativeLuminance(hslToRgb(navy)),
            relativeLuminance(neutralOverlay),
          ) +
            0.05) /
            (Math.min(
              relativeLuminance(hslToRgb(navy)),
              relativeLuminance(neutralOverlay),
            ) +
              0.05),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("restores every ladder token after a light-dark-light round trip", () => {
    const firstLight = themeDeclarations("light");
    const dark = themeDeclarations("dark");
    const restoredLight = themeDeclarations("light");
    const ladder = [
      "paper",
      "surface-sunken",
      "background",
      "card",
      "surface-elevated",
    ];

    expect(dark).not.toEqual(firstLight);
    expect(
      Object.fromEntries(ladder.map((token) => [token, restoredLight[token]])),
    ).toEqual(
      Object.fromEntries(ladder.map((token) => [token, firstLight[token]])),
    );
  });

  it.each(["light", "dark"] as const)(
    "keeps every %s label contract AA over the worst ambient and substrate composite",
    (theme) => {
      const tokens = themeDeclarations(theme);
      const primary = hslToRgb(parseHsl(resolveToken(tokens, "primary")));
      const foreground = hslToRgb(
        parseHsl(resolveToken(tokens, "foreground")),
      );
      const muted = hslToRgb(
        parseHsl(resolveToken(tokens, "muted-foreground")),
      );
      const navy = hslToRgb(
        parseHsl(resolveToken(tokens, "brand-navy")),
      );
      const white = hslToRgb(parseHsl("0 0% 100%"));
      const labelScrim = hslToRgb(
        parseHsl(resolveToken(tokens, "ambient-label-scrim")),
      );
      const labelScrimAlpha = Number(
        resolveToken(tokens, "ambient-label-scrim-alpha"),
      );

      for (const surfaceToken of [
        "background",
        "surface-sunken",
      ] as const) {
        const surface = worstAmbientSurface(tokens, surfaceToken);
        expect(
          contrastRgb(foreground, surface),
          `${theme} foreground/${surfaceToken} ambient composite`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRgb(muted, surface),
          `${theme} muted/${surfaceToken} ambient composite`,
        ).toBeGreaterThanOrEqual(4.5);

        const eyebrowSurface = composite(
          labelScrim,
          labelScrimAlpha,
          surface,
        );
        expect(
          contrastRgb(primary, eyebrowSurface),
          `${theme} primary eyebrow/ambient composite`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRgb(muted, surface),
          `${theme} inactive segmented label`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRgb(foreground, surface),
          `${theme} disabled button label`,
        ).toBeGreaterThanOrEqual(4.5);

        for (const [highlight, alpha] of [
          [primary, 0.55],
          [hslToRgb(parseHsl(resolveToken(tokens, "accent"))), 0.75],
        ] as const) {
          const transmitted = composite(highlight, alpha, surface);
          const neutralOverlay = composite(white, 0.4, transmitted);
          expect(
            contrastRgb(navy, neutralOverlay),
            `${theme} active segmented label`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }

      for (const plateStop of [
        parseHsl("170 82% 26%"),
        parseHsl("174 72% 20%"),
      ]) {
        expect(
          contrastRgb(
            white,
            composite(white, 0.04, hslToRgb(plateStop)),
          ),
          `${theme} primary button label`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
