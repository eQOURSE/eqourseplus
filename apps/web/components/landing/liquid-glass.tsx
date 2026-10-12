"use client";

import {
  acquireRefractionSlot,
  isLowEndDevice,
  prefersReducedMotion,
  releaseRefractionSlot,
} from "@eqourse/ui";
import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { buildRefractionPixels, DEFAULT_OPTICS, type GlassOptics } from "./glass-optics";

/**
 * regular — frosted surface (blur + saturation + rim light), everywhere.
 * clear   — thinner frosting for chips and overlays.
 * focal   — real refraction where supported; counts against the shared
 *           three-element budget, otherwise falls back to regular.
 */
export type GlassTier = "regular" | "clear" | "focal";

interface RefractionMap {
  url: string;
  width: number;
  height: number;
  scale: number;
  version: number;
}

const MAX_AREA = 1_100_000;

/**
 * Only Chromium renders SVG filters inside backdrop-filter. Reduced motion
 * and low-end devices stay frosted as well.
 */
export function supportsBackdropRefraction(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const brands = (navigator as Navigator & {
    userAgentData?: { brands?: ReadonlyArray<{ brand: string }> };
  }).userAgentData?.brands;
  const chromium = brands?.some((entry) => /Chromium/i.test(entry.brand)) ?? false;
  return chromium && !prefersReducedMotion() && !isLowEndDevice();
}

function cornerRadius(el: HTMLElement, fallback: number, width: number, height: number) {
  const parsed = Number.parseFloat(window.getComputedStyle(el).borderTopLeftRadius);
  const radius = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return Math.min(radius, width / 2, height / 2);
}

function createMap(
  width: number,
  height: number,
  radius: number,
  optics: GlassOptics,
  version: number,
): RefractionMap | null {
  const { pixels, width: w, height: h, scale } = buildRefractionPixels(width, height, radius, optics);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const image = context.createImageData(w, h);
  image.data.set(pixels);
  context.putImageData(image, 0, 0);
  return { url: canvas.toDataURL("image/png"), width, height, scale, version };
}

type LiquidGlassProps = {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  tier?: GlassTier;
  /** Fallback corner radius (px) when the computed radius is unavailable. */
  radius?: number;
  bezel?: number;
  thickness?: number;
  ior?: number;
  /** Split R/G/B slightly at the rim for chromatic fringing. */
  dispersion?: boolean;
  [key: string]: unknown;
};

/**
 * Liquid glass surface. Focal instances bend whatever sits behind them with
 * a physically derived displacement map (see glass-optics.ts); the map is
 * built after mount, so first paint and LCP always use the frosted tier.
 */
export function LiquidGlass({
  as: Tag = "div",
  children,
  className = "",
  style,
  tier = "regular",
  radius = 28,
  bezel = DEFAULT_OPTICS.bezel,
  thickness = DEFAULT_OPTICS.thickness,
  ior = DEFAULT_OPTICS.ior,
  dispersion = false,
  ...rest
}: LiquidGlassProps) {
  const ref = useRef<HTMLElement>(null);
  const baseId = `q-lg-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [map, setMap] = useState<RefractionMap | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (tier !== "focal" || !el || typeof ResizeObserver === "undefined" || !supportsBackdropRefraction()) {
      return;
    }
    const slot = acquireRefractionSlot();
    if (!slot) return;

    let timer = 0;
    let last = "";
    let version = 0;
    const update = () => {
      const width = Math.round(el.offsetWidth);
      const height = Math.round(el.offsetHeight);
      const key = `${width}x${height}`;
      if (key === last) return;
      last = key;
      if (width < 12 || height < 12 || width * height > MAX_AREA) {
        setMap(null);
        return;
      }
      version += 1;
      const r = cornerRadius(el, radius, width, height);
      setMap(createMap(width, height, r, { bezel, thickness, ior }, version));
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 90);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(el);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      releaseRefractionSlot(slot);
      setMap(null);
    };
  }, [tier, radius, bezel, thickness, ior]);

  // A fresh filter id per map keeps browsers from reusing a stale filter.
  const filterId = map ? `${baseId}-${map.version}` : baseId;
  const glassStyle = map ? ({ ...style, "--q-lg-filter": `url(#${filterId})` } as CSSProperties) : style;

  return (
    <Tag
      ref={ref}
      className={`q-glass${className ? ` ${className}` : ""}`}
      style={glassStyle}
      data-glass={map ? "refraction" : "frosted"}
      data-tier={tier}
      {...rest}
    >
      {map ? (
        <svg className="q-glass__defs" width="0" height="0" aria-hidden="true" focusable="false">
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
            {dispersion ? (
              <>
                <feDisplacementMap in="SourceGraphic" in2="map" scale={map.scale * 1.08} xChannelSelector="R" yChannelSelector="G" result="dr" />
                <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
                <feDisplacementMap in="SourceGraphic" in2="map" scale={map.scale} xChannelSelector="R" yChannelSelector="G" result="dg" />
                <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
                <feDisplacementMap in="SourceGraphic" in2="map" scale={map.scale * 0.92} xChannelSelector="R" yChannelSelector="G" result="db" />
                <feColorMatrix in="db" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
                <feBlend in="r" in2="g" mode="screen" result="rg" />
                <feBlend in="rg" in2="b" mode="screen" />
              </>
            ) : (
              <feDisplacementMap in="SourceGraphic" in2="map" scale={map.scale} xChannelSelector="R" yChannelSelector="G" />
            )}
          </filter>
        </svg>
      ) : null}
      {children}
    </Tag>
  );
}
