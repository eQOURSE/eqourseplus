export interface DisplacementMapOptions {
  width: number;
  height: number;
}

const NEUTRAL = 128;
const MAX_CHANNEL_DELTA = 86;

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
) {
  const index = (y * width + x) * 4;
  pixels[index] = red;
  pixels[index + 1] = green;
  pixels[index + 2] = NEUTRAL;
  pixels[index + 3] = 255;
}

export function createDisplacementPixels({
  width,
  height,
}: DisplacementMapOptions): Uint8ClampedArray {
  const safeWidth = Math.max(2, Math.floor(width));
  const safeHeight = Math.max(2, Math.floor(height));
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
        ? smoothstep(0.34, 1, roundedRectangleDistance)
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

      setPixel(
        pixels,
        safeWidth,
        x,
        y,
        NEUTRAL - xDelta,
        NEUTRAL - yDelta,
      );
      setPixel(
        pixels,
        safeWidth,
        mirroredX,
        y,
        NEUTRAL + xDelta,
        NEUTRAL - yDelta,
      );
      setPixel(
        pixels,
        safeWidth,
        x,
        mirroredY,
        NEUTRAL - xDelta,
        NEUTRAL + yDelta,
      );
      setPixel(
        pixels,
        safeWidth,
        mirroredX,
        mirroredY,
        NEUTRAL + xDelta,
        NEUTRAL + yDelta,
      );
    }
  }

  return pixels;
}

export function createDisplacementDataUrl(
  sourceWidth: number,
  sourceHeight: number,
): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const aspectRatio = sourceWidth / Math.max(sourceHeight, 1);
  const mapWidth = Math.max(
    48,
    Math.min(128, Math.round(aspectRatio >= 1 ? 128 : 128 * aspectRatio)),
  );
  const mapHeight = Math.max(
    48,
    Math.min(128, Math.round(aspectRatio >= 1 ? 128 / aspectRatio : 128)),
  );
  const evenWidth = mapWidth + (mapWidth % 2);
  const evenHeight = mapHeight + (mapHeight % 2);
  const canvas = document.createElement("canvas");
  canvas.width = evenWidth;
  canvas.height = evenHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const imageData = context.createImageData(evenWidth, evenHeight);
  imageData.data.set(
    createDisplacementPixels({ width: evenWidth, height: evenHeight }),
  );
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
