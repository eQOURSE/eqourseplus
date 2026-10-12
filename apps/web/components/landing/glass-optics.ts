/**
 * Physics for the liquid-glass refraction map (after kube.io's
 * "Liquid Glass in the Browser"). A convex-squircle bezel bends vertical
 * rays by Snell's law; the horizontal travel of each refracted ray before it
 * reaches the page becomes a displacement vector encoded in R (x) / G (y).
 */

export interface GlassOptics {
  /** Width of the curved rim, px. */
  bezel: number;
  /** Glass height at the end of the rim, px. */
  thickness: number;
  /** Refractive index (air = 1). */
  ior: number;
}

export const DEFAULT_OPTICS: GlassOptics = { bezel: 22, thickness: 26, ior: 1.5 };

/** Apple-style squircle profile: 0 at the outer edge, 1 where the face is flat. */
export function squircle(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return Math.pow(1 - Math.pow(1 - x, 4), 0.25);
}

/** Inward displacement (px) for rays hitting the rim at normalised depth t. */
export function rayDisplacement(t: number, { bezel, thickness, ior }: GlassOptics): number {
  const clamped = Math.min(0.999, Math.max(0.001, t));
  const h = 1e-3;
  const slope =
    ((squircle(clamped + h) - squircle(clamped - h)) / (2 * h)) * (thickness / Math.max(1, bezel));
  const height = squircle(clamped) * thickness;
  const len = Math.hypot(slope, 1);
  const eta = 1 / ior;
  const cosI = 1 / len;
  const sinT2 = eta * eta * (1 - cosI * cosI);
  if (sinT2 > 1) return 0;
  const cosT = Math.sqrt(1 - sinT2);
  // t = eta·i + (eta·cosI − cosT)·n with i = (0, −1), n = (−slope, 1) / len
  const tr = ((cosT - eta * cosI) * slope) / len;
  const tz = -eta + (eta * cosI - cosT) / len;
  return tz < 0 ? (height * tr) / -tz : 0;
}

/** Sampled displacement profile across the rim plus its maximum. */
export function displacementProfile(optics: GlassOptics, samples = 128) {
  const values = new Float32Array(samples);
  let max = 0;
  for (let index = 0; index < samples; index += 1) {
    const value = rayDisplacement(index / (samples - 1), optics);
    values[index] = value;
    max = Math.max(max, value);
  }
  return { values, max };
}

/**
 * RGBA pixels for a rounded-rectangle lens of the given CSS size, sampled at
 * `scale` resolution. Returns the pixels and the feDisplacementMap scale.
 */
export function buildRefractionPixels(
  width: number,
  height: number,
  radius: number,
  optics: GlassOptics = DEFAULT_OPTICS,
  scale = 0.5,
) {
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));
  const pixels = new Uint8ClampedArray(w * h * 4);
  const { values, max } = displacementProfile(optics);
  const r = Math.min(radius, width / 2, height / 2);
  const bezel = Math.min(optics.bezel, Math.min(width, height) / 2);
  const hx = width / 2;
  const hy = height / 2;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      // centre of this map pixel in CSS px, relative to the lens centre
      const px = (x + 0.5) / scale - hx;
      const py = (y + 0.5) / scale - hy;
      const qx = Math.abs(px) - (hx - r);
      const qy = Math.abs(py) - (hy - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const outside = Math.hypot(ox, oy);
      const depth = -(outside + Math.min(Math.max(qx, qy), 0) - r);
      let vx = 0;
      let vy = 0;
      if (depth > 0 && depth < bezel && max > 0) {
        // outward normal of the rounded rectangle at this point
        let nx = 0;
        let ny = 0;
        if (qx > 0 && qy > 0 && outside > 0) {
          nx = (ox / outside) * Math.sign(px);
          ny = (oy / outside) * Math.sign(py);
        } else if (qx > qy) {
          nx = Math.sign(px);
        } else {
          ny = Math.sign(py);
        }
        const sample = values[Math.min(values.length - 1, Math.round((depth / bezel) * (values.length - 1)))] ?? 0;
        const magnitude = sample / max;
        // sample the page further inside the lens
        vx = -nx * magnitude;
        vy = -ny * magnitude;
      }
      const index = (y * w + x) * 4;
      pixels[index] = Math.round(128 + vx * 127);
      pixels[index + 1] = Math.round(128 + vy * 127);
      pixels[index + 2] = 128;
      pixels[index + 3] = 255;
    }
  }

  // feDisplacementMap shifts by scale × (channel − 0.5), so double the max.
  return { pixels, width: w, height: h, scale: Math.ceil(max * 2) };
}
