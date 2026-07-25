export interface DisplacementMapOptions {
  width: number;
  height: number;
  /** Aave-style 0–100 rim concentration; higher pulls the bend to the edge. */
  curvature?: number;
}

const NEUTRAL = 128;
export const MAX_CHANNEL_DELTA = 120;
export const SPECULAR_MAX_DELTA = 102;
export const DEFAULT_CURVATURE = 65;
const LIGHT_X = -Math.SQRT1_2;
const LIGHT_Y = -Math.SQRT1_2;

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const normalized = Math.min(
    1,
    Math.max(0, (value - edgeStart) / (edgeEnd - edgeStart)),
  );
  return normalized * normalized * (3 - 2 * normalized);
}

function setPixel(
  pixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
) {
  const index = (y * width + x) * 4;
  pixels[index] = red;
  pixels[index + 1] = green;
  pixels[index + 2] = blue;
  pixels[index + 3] = 255;
}

function specularBlue(
  normalX: number,
  normalY: number,
  edgeStrength: number,
) {
  const lightDot = Math.min(
    1,
    Math.max(0, -(normalX * LIGHT_X + normalY * LIGHT_Y)),
  );
  return (
    NEUTRAL +
    Math.round(
      Math.pow(edgeStrength, 1.6) * lightDot * SPECULAR_MAX_DELTA,
    )
  );
}

export function createDisplacementPixels({
  width,
  height,
  curvature = DEFAULT_CURVATURE,
}: DisplacementMapOptions): Uint8ClampedArray {
  const safeWidth = Math.max(2, Math.floor(width));
  const safeHeight = Math.max(2, Math.floor(height));
  const rimExponent = Math.max(0.5, curvature / 40);
  const pixels = new Uint8ClampedArray(safeWidth * safeHeight * 4);
  const halfWidth = Math.ceil(safeWidth / 2);
  const halfHeight = Math.ceil(safeHeight / 2);
  const centerX = (safeWidth - 1) / 2;
  const centerY = (safeHeight - 1) / 2;

  for (let y = 0; y < halfHeight; y += 1) {
    for (let x = 0; x < halfWidth; x += 1) {
      const normalizedX = (centerX - x) / Math.max(centerX, 1);
      const normalizedY = (centerY - y) / Math.max(centerY, 1);
      const roundedRectangleDistance = Math.pow(
        Math.pow(normalizedX, 4) + Math.pow(normalizedY, 4),
        1 / 4,
      );
      const insideLens = roundedRectangleDistance <= 1;
      const edgeStrength = insideLens
        ? Math.pow(smoothstep(0.3, 1, roundedRectangleDistance), rimExponent)
        : 0;
      const vectorLength =
        Math.hypot(normalizedX, normalizedY) || Number.EPSILON;
      const xDelta = insideLens
        ? Math.round(
            (normalizedX / vectorLength) *
              edgeStrength *
              MAX_CHANNEL_DELTA,
          )
        : 0;
      const yDelta = insideLens
        ? Math.round(
            (normalizedY / vectorLength) *
              edgeStrength *
              MAX_CHANNEL_DELTA,
          )
        : 0;
      const mirroredX = safeWidth - 1 - x;
      const mirroredY = safeHeight - 1 - y;
      const normalX = normalizedX / vectorLength;
      const normalY = normalizedY / vectorLength;

      setPixel(
        pixels,
        safeWidth,
        x,
        y,
        NEUTRAL + xDelta,
        NEUTRAL + yDelta,
        specularBlue(normalX, normalY, edgeStrength),
      );
      setPixel(
        pixels,
        safeWidth,
        mirroredX,
        y,
        NEUTRAL - xDelta,
        NEUTRAL + yDelta,
        specularBlue(-normalX, normalY, edgeStrength),
      );
      setPixel(
        pixels,
        safeWidth,
        x,
        mirroredY,
        NEUTRAL + xDelta,
        NEUTRAL - yDelta,
        specularBlue(normalX, -normalY, edgeStrength),
      );
      setPixel(
        pixels,
        safeWidth,
        mirroredX,
        mirroredY,
        NEUTRAL - xDelta,
        NEUTRAL - yDelta,
        specularBlue(-normalX, -normalY, edgeStrength),
      );
    }
  }

  return pixels;
}

export function getDisplacementMapDimensions(
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  const aspectRatio = safeWidth / safeHeight;
  const longestSide = 256;
  const width = aspectRatio >= 1 ? longestSide : longestSide * aspectRatio;
  const height = aspectRatio >= 1 ? longestSide / aspectRatio : longestSide;
  const makeEven = (value: number) => {
    const clamped = Math.max(48, Math.min(longestSide, Math.round(value)));
    return clamped + (clamped % 2);
  };

  return { width: makeEven(width), height: makeEven(height) };
}

export function maxDisplacementPx(strength: number): number {
  return Math.ceil((MAX_CHANNEL_DELTA / 255) * Math.max(0, strength));
}

export function restoreNeutralMapZones(
  raw: Uint8ClampedArray,
  softened: Uint8ClampedArray,
): Uint8ClampedArray {
  const restored = new Uint8ClampedArray(softened);
  for (let index = 0; index < raw.length; index += 4) {
    if (
      raw[index] === NEUTRAL &&
      raw[index + 1] === NEUTRAL &&
      raw[index + 2] === NEUTRAL
    ) {
      restored[index] = NEUTRAL;
      restored[index + 1] = NEUTRAL;
      restored[index + 2] = NEUTRAL;
      restored[index + 3] = 255;
    }
  }
  return restored;
}

export function createDisplacementDataUrl(
  sourceWidth: number,
  sourceHeight: number,
  curvature: number = DEFAULT_CURVATURE,
): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const { width: evenWidth, height: evenHeight } =
    getDisplacementMapDimensions(sourceWidth, sourceHeight);
  const canvas = document.createElement("canvas");
  canvas.width = evenWidth;
  canvas.height = evenHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const imageData = context.createImageData(evenWidth, evenHeight);
  imageData.data.set(
    createDisplacementPixels({ width: evenWidth, height: evenHeight, curvature }),
  );
  context.putImageData(imageData, 0, 0);

  const softenedCanvas = document.createElement("canvas");
  softenedCanvas.width = evenWidth;
  softenedCanvas.height = evenHeight;
  const softenedContext = softenedCanvas.getContext("2d");
  if (!softenedContext || !("filter" in softenedContext)) {
    return canvas.toDataURL("image/png");
  }

  softenedContext.filter = `blur(${Math.max(
    2,
    Math.round(Math.min(evenWidth, evenHeight) * 0.05),
  )}px)`;
  softenedContext.drawImage(canvas, 0, 0);
  const softenedImage = softenedContext.getImageData(
    0,
    0,
    evenWidth,
    evenHeight,
  );
  softenedImage.data.set(
    restoreNeutralMapZones(imageData.data, softenedImage.data),
  );
  softenedContext.putImageData(softenedImage, 0, 0);
  return softenedCanvas.toDataURL("image/png");
}
