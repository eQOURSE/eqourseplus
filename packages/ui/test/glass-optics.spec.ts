import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import * as glassModule from "../src/components/glass";
import * as displacementMap from "../src/glass/displacement-map";

const glassSource = readFileSync(
  new URL("../src/components/glass.tsx", import.meta.url),
  "utf8",
);

const optics = displacementMap as typeof displacementMap & {
  MAX_CHANNEL_DELTA?: number;
  SPECULAR_MAX_DELTA?: number;
  getDisplacementMapDimensions?: (
    width: number,
    height: number,
  ) => { width: number; height: number };
  maxDisplacementPx?: (strength: number) => number;
  restoreNeutralMapZones?: (
    raw: Uint8ClampedArray,
    softened: Uint8ClampedArray,
  ) => Uint8ClampedArray;
};

const filterGeometry = glassModule as typeof glassModule & {
  CHROMA_STAGGER?: number;
  calculateFilterRegion?: (
    width: number,
    height: number,
    strength: number,
  ) => {
    margin: number;
    x: string;
    y: string;
    width: string;
    height: string;
  };
};

function channel(
  pixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  offset: number,
) {
  return pixels[(y * width + x) * 4 + offset] ?? 128;
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "document");
});

describe("FR-PUB-00B convex displacement map", () => {
  it("samples inward at every rim while keeping the centre and exterior neutral", () => {
    const width = 64;
    const height = 64;
    const pixels = displacementMap.createDisplacementPixels({ width, height });
    const centre = 32;

    expect(channel(pixels, width, 1, centre, 0)).toBeGreaterThan(128);
    expect(channel(pixels, width, 62, centre, 0)).toBeLessThan(128);
    expect(channel(pixels, width, centre, 1, 1)).toBeGreaterThan(128);
    expect(channel(pixels, width, centre, 62, 1)).toBeLessThan(128);

    expect(channel(pixels, width, centre, centre, 0)).toBe(128);
    expect(channel(pixels, width, centre, centre, 1)).toBe(128);
    expect(channel(pixels, width, 0, 0, 0)).toBe(128);
    expect(channel(pixels, width, 0, 0, 1)).toBe(128);
  });

  it("preserves quarter-map symmetry", () => {
    const width = 64;
    const height = 64;
    const pixels = displacementMap.createDisplacementPixels({ width, height });

    for (const [x, y] of [
      [2, 31],
      [7, 18],
      [15, 11],
      [23, 28],
    ]) {
      expect(
        channel(pixels, width, x, y, 0) +
          channel(pixels, width, width - 1 - x, y, 0),
      ).toBeCloseTo(256, 0);
      expect(
        channel(pixels, width, x, y, 1) +
          channel(pixels, width, x, height - 1 - y, 1),
      ).toBeCloseTo(256, 0);
    }
  });

  it("encodes a capped upper-left specular rim in blue", () => {
    const width = 64;
    const height = 64;
    const pixels = displacementMap.createDisplacementPixels({ width, height });
    const blue = Array.from(
      { length: width * height },
      (_, index) => pixels[index * 4 + 2] ?? 128,
    );
    const upperLeftRim = [];

    for (let y = 0; y < height / 2; y += 1) {
      for (let x = 0; x < width / 2; x += 1) {
        upperLeftRim.push(channel(pixels, width, x, y, 2));
      }
    }

    expect(optics.SPECULAR_MAX_DELTA).toBe(102);
    expect(channel(pixels, width, 32, 32, 2)).toBe(128);
    expect(channel(pixels, width, 0, 0, 2)).toBe(128);
    expect(Math.max(...upperLeftRim)).toBeGreaterThanOrEqual(160);
    expect(Math.max(...blue)).toBeLessThanOrEqual(230);
  });

  it("keeps the raw rim continuous before canvas softening", () => {
    const width = 64;
    const pixels = displacementMap.createDisplacementPixels({
      width,
      height: width,
    });
    const y = width / 2;
    let maximumJump = 0;

    for (let x = 1; x < width; x += 1) {
      maximumJump = Math.max(
        maximumJump,
        Math.abs(
          channel(pixels, width, x, y, 0) -
            channel(pixels, width, x - 1, y, 0),
        ),
      );
    }

    expect(maximumJump).toBeLessThanOrEqual(120);
  });

  it("uses an even aspect-preserving map up to 256px", () => {
    const dimensions = optics.getDisplacementMapDimensions?.(640, 320);

    expect(dimensions).toEqual({ width: 256, height: 128 });
    expect(dimensions?.width).toBeGreaterThanOrEqual(48);
    expect(dimensions?.height).toBeGreaterThanOrEqual(48);
    expect((dimensions?.width ?? 1) % 2).toBe(0);
    expect((dimensions?.height ?? 1) % 2).toBe(0);
  });

  it("runs a guarded second-canvas blur before encoding the map", () => {
    const canvases: Array<{
      context: {
        createImageData: (width: number, height: number) => ImageData;
        drawImage: ReturnType<typeof vi.fn>;
        filter: string;
        getImageData: (
          x: number,
          y: number,
          width: number,
          height: number,
        ) => ImageData;
        putImageData: ReturnType<typeof vi.fn>;
      };
      height: number;
      toDataURL: ReturnType<typeof vi.fn>;
      width: number;
    }> = [];

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => {
          const context = {
            createImageData: (width: number, height: number) =>
              ({
                colorSpace: "srgb",
                data: new Uint8ClampedArray(width * height * 4),
                height,
                width,
              }) as ImageData,
            drawImage: vi.fn(),
            filter: "none",
            getImageData: (
              _x: number,
              _y: number,
              width: number,
              height: number,
            ) =>
              ({
                colorSpace: "srgb",
                data: new Uint8ClampedArray(width * height * 4).fill(132),
                height,
                width,
              }) as ImageData,
            putImageData: vi.fn(),
          };
          const canvas = {
            context,
            height: 0,
            toDataURL: vi.fn(() => `data:canvas-${canvases.length}`),
            width: 0,
            getContext: () => context,
          };
          canvases.push(canvas);
          return canvas;
        },
      },
    });

    const url = displacementMap.createDisplacementDataUrl(640, 320);

    expect(canvases).toHaveLength(2);
    expect(canvases[0]).toMatchObject({ width: 256, height: 128 });
    expect(canvases[1]).toMatchObject({ width: 256, height: 128 });
    expect(canvases[1]?.context.filter).toMatch(/^blur\(\d+px\)$/);
    expect(canvases[1]?.context.drawImage).toHaveBeenCalledTimes(1);
    expect(url).toBe("data:canvas-2");
  });

  it("restores centre and exterior neutrality after map softening", () => {
    const width = 64;
    const raw = displacementMap.createDisplacementPixels({
      width,
      height: width,
    });
    const softened = new Uint8ClampedArray(raw.length).fill(132);
    const restored = optics.restoreNeutralMapZones?.(raw, softened);

    expect(restored).toBeDefined();
    expect(channel(restored ?? softened, width, 32, 32, 0)).toBe(128);
    expect(channel(restored ?? softened, width, 32, 32, 1)).toBe(128);
    expect(channel(restored ?? softened, width, 0, 0, 0)).toBe(128);
    expect(channel(restored ?? softened, width, 0, 0, 1)).toBe(128);
    expect(channel(restored ?? softened, width, 0, 0, 2)).toBe(128);
  });
});

describe("FR-PUB-00B filter geometry and graph", () => {
  it.each([24, 36, 44])(
    "covers maximum displacement plus eight pixels at strength %i",
    (strength) => {
      const region = filterGeometry.calculateFilterRegion?.(
        176,
        176,
        strength,
      );
      const expectedMargin =
        Math.ceil(((optics.MAX_CHANNEL_DELTA ?? 120) / 255) * strength) + 8;

      expect(optics.maxDisplacementPx?.(strength)).toBe(
        expectedMargin - 8,
      );
      expect(region?.margin).toBeGreaterThanOrEqual(expectedMargin);
      expect(Number.parseFloat(region?.x ?? "0")).toBeLessThan(0);
      expect(Number.parseFloat(region?.y ?? "0")).toBeLessThan(0);
      expect(Number.parseFloat(region?.width ?? "0")).toBeGreaterThan(100);
      expect(Number.parseFloat(region?.height ?? "0")).toBeGreaterThan(100);
    },
  );

  it("locks the per-channel stagger and removes painted fringe lighting", () => {
    expect(filterGeometry.CHROMA_STAGGER).toBe(0.045);
    expect(filterGeometry.CHROMA_STAGGER).toBeLessThanOrEqual(0.06);
    expect(glassSource.match(/<feDisplacementMap/g)).toHaveLength(3);
    expect(glassSource.match(/result="disp-[rgb]-raw"/g)).toHaveLength(3);
    expect(glassSource).toContain('operator="arithmetic"');
    expect(glassSource).toContain('k2="1"');
    expect(glassSource).toContain('k3="1"');
    expect(glassSource).not.toContain("<feOffset");
    expect(glassSource).not.toContain("<feSpecularLighting");
    expect(glassSource).not.toContain("<fePointLight");
    expect(glassSource).not.toContain("#0F9B8E");
    expect(glassSource).not.toContain("#7BE8C9");
  });

  it("uses a neutral map background, explicit image dimensions, and map specular", () => {
    expect(glassSource).toContain('floodColor="rgb(128,128,128)"');
    expect(glassSource).toMatch(
      /<feImage[\s\S]*?width=\{config\.width\}[\s\S]*?height=\{config\.height\}/,
    );
    expect(glassSource).toMatch(
      /<feComposite[\s\S]*?in="raw-map"[\s\S]*?in2="map-bg"[\s\S]*?operator="over"/,
    );
    expect(glassSource).toContain(
      "0 0 1 0 -0.5019607843137255",
    );
    expect(glassSource).toContain('colorInterpolationFilters="sRGB"');
  });
});
