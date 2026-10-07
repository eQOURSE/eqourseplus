"use client";

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

interface LensMap {
  url: string;
  width: number;
  height: number;
}

/**
 * Builds a displacement map for a rounded-rect convex lens. Inside the bezel
 * band the surface bends, so rim pixels sample inward (R = x, G = y, 0.5 =
 * neutral); the flat centre and exterior stay neutral.
 */
export function buildLensMap(width: number, height: number, radius: number, bezel: number): string | null {
  const scale = 0.5;
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(w, h);
  const r = Math.min(radius * scale, w / 2, h / 2);
  const b = Math.max(1, bezel * scale);
  const hx = w / 2;
  const hy = h / 2;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + 0.5 - hx;
      const py = y + 0.5 - hy;
      const qx = Math.abs(px) - (hx - r);
      const qy = Math.abs(py) - (hy - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const outside = Math.hypot(ox, oy);
      const sdf = outside + Math.min(Math.max(qx, qy), 0) - r;
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
      const depth = -sdf;
      let mag = 0;
      if (depth > 0 && depth < b) {
        const t = 1 - depth / b;
        mag = Math.pow(t, 2.2);
      }
      const i = (y * w + x) * 4;
      image.data[i] = Math.round(128 - nx * mag * 127);
      image.data[i + 1] = Math.round(128 - ny * mag * 127);
      image.data[i + 2] = Math.round(mag * 255);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

export function supportsBackdropRefraction(): boolean {
  if (typeof navigator === "undefined" || typeof window.matchMedia !== "function") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const ua = navigator.userAgent;
  return /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS/.test(ua);
}

interface LiquidLensProps {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  radius?: number;
  bezel?: number;
  strength?: number;
  [key: string]: unknown;
}

/**
 * Liquid glass with live refraction of whatever sits behind it. Falls back to
 * the frosted .lx-glass surface wherever SVG backdrop filters are unavailable.
 */
export function LiquidLens({
  as: Tag = "div",
  children,
  className = "",
  style,
  radius = 28,
  bezel = 24,
  strength = 46,
  ...rest
}: LiquidLensProps) {
  const ref = useRef<HTMLElement>(null);
  const rawId = useId();
  const filterId = `lx-lens-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [map, setMap] = useState<LensMap | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !supportsBackdropRefraction()) return;
    let handle = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8 || rect.width * rect.height > 1_400_000) {
        setMap(null);
        return;
      }
      const url = buildLensMap(rect.width, rect.height, radius, bezel);
      setMap(url ? { url, width: rect.width, height: rect.height } : null);
    };
    const schedule = () => {
      window.clearTimeout(handle);
      handle = window.setTimeout(update, 120);
    };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    return () => {
      window.clearTimeout(handle);
      observer.disconnect();
    };
  }, [radius, bezel]);

  const lensStyle = map
    ? ({ ...style, "--lx-lens-filter": `url(#${filterId})` } as CSSProperties)
    : style;

  return (
    <Tag
      ref={ref}
      className={`${className}${map ? " lx-refract" : ""}`}
      style={lensStyle}
      data-lens={map ? "refraction" : "frosted"}
      {...rest}
    >
      {map ? (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
          <filter
            id={filterId}
            x="0"
            y="0"
            width={map.width}
            height={map.height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={map.url} x="0" y="0" width={map.width} height={map.height} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" result="dr" />
            <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength * 0.95} xChannelSelector="R" yChannelSelector="G" result="dg" />
            <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength * 0.9} xChannelSelector="R" yChannelSelector="G" result="db" />
            <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feBlend in="r" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b" mode="screen" />
          </filter>
        </svg>
      ) : null}
      {children}
    </Tag>
  );
}
