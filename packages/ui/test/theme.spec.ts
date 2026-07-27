import { describe, expect, it, vi } from "vitest";

import {
  THEME_STORAGE_KEY,
  persistTheme,
  resolveTheme,
} from "../src/theme/resolution";
import {
  composite,
  contrast,
  contrastRgb,
  hslToRgb,
  parseHsl,
  relativeLuminance,
  resolveToken,
  themeDeclarations,
  worstAmbientSurface,
} from "./contrast-helpers";

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
