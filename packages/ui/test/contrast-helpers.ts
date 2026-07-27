import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const stylesSource = readFileSync(
  resolve(
    process.cwd(),
    process.cwd().replaceAll("\\", "/").endsWith("/packages/ui")
      ? "src/styles.css"
      : "../../packages/ui/src/styles.css",
  ),
  "utf8",
);

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

function declarations(block: string) {
  return Object.fromEntries(
    Array.from(
      block.matchAll(/--([\w-]+):\s*([^;]+);/g),
      (match) => [match[1] ?? "", (match[2] ?? "").trim()],
    ),
  );
}

export function themeDeclarations(theme: "light" | "dark") {
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

export function resolveToken(
  tokens: Record<string, string>,
  name: string,
): string {
  const value = tokens[name];
  if (!value) {
    return "";
  }
  const reference = value.match(/^var\(--([\w-]+)\)$/)?.[1];
  return reference ? resolveToken(tokens, reference) : value;
}

export function parseHsl(value: string): Hsl {
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

export function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
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

export function relativeLuminance(rgb: [number, number, number]) {
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  ) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrast(first: Hsl, second: Hsl) {
  const firstLuminance = relativeLuminance(hslToRgb(first));
  const secondLuminance = relativeLuminance(hslToRgb(second));
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

export function composite(
  foreground: [number, number, number],
  alpha: number,
  background: [number, number, number],
): [number, number, number] {
  return foreground.map(
    (channel, index) =>
      channel * alpha + (background[index] ?? 0) * (1 - alpha),
  ) as [number, number, number];
}

export function parseHex(value: string): [number, number, number] {
  const match = value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  const red = match?.[1];
  const green = match?.[2];
  const blue = match?.[3];
  if (!red || !green || !blue) {
    throw new Error(`Expected a six-digit hex color, received "${value}"`);
  }
  return [red, green, blue].map(
    (channel) => Number.parseInt(channel, 16) / 255,
  ) as [number, number, number];
}

export function contrastRgb(
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

export function worstAmbientSurface(
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
