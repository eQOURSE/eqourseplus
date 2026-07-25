"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  acquireRefractionSlot,
  isLowEndDevice,
  prefersReducedMotion,
  releaseRefractionSlot,
  resolveGlassTier,
  supportsCanvas2d,
  supportsSvgRefraction,
  type RefractionSlot,
} from "../glass/capabilities";
import {
  DEFAULT_CURVATURE,
  createDisplacementDataUrl,
  maxDisplacementPx,
} from "../glass/displacement-map";
import {
  FrostedSurface,
  type FrostedSurfaceProps,
} from "./frosted-surface";

export interface GlassProps extends FrostedSurfaceProps {
  activated?: boolean;
  curvature?: number;
  disabled?: boolean;
  refractedContent?: ReactNode;
  strength?: number;
}

interface RefractionConfig {
  filterId: string;
  height: number;
  mapUrl: string;
  width: number;
}

const POST_LCP_INITIALIZATION_DELAY_MS = 12000;
export const CHROMA_STAGGER = 0.045;

export function calculateFilterRegion(
  width: number,
  height: number,
  strength: number,
) {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const margin = maxDisplacementPx(strength) + 8;
  const horizontalMargin = (margin / safeWidth) * 100;
  const verticalMargin = (margin / safeHeight) * 100;

  return {
    margin,
    x: `${-horizontalMargin}%`,
    y: `${-verticalMargin}%`,
    width: `${100 + horizontalMargin * 2}%`,
    height: `${100 + verticalMargin * 2}%`,
  };
}

let filterRevision = 0;

function createFreshFilterId(): string {
  filterRevision += 1;
  return `eqourse-glass-filter-${filterRevision}`;
}

export function Glass({
  activated = false,
  children,
  className = "",
  curvature = DEFAULT_CURVATURE,
  disabled = false,
  refractedContent,
  strength = 30,
  style,
  variant = "panel",
  ...props
}: GlassProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<RefractionSlot | null>(null);
  const [config, setConfig] = useState<RefractionConfig | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || disabled) {
      setConfig(null);
      return;
    }

    let disposed = false;
    let intersectionObserver: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let idleHandle: number | null = null;
    let fallbackHandle: number | null = null;
    let resizeHandle: number | null = null;
    let loadListener: (() => void) | null = null;
    let initializationScheduled = false;
    let filterGenerated = false;
    let interactionRequested = false;
    let pageLoaded = document.readyState === "complete";

    const releaseSlot = () => {
      releaseRefractionSlot(slotRef.current);
      slotRef.current = null;
    };

    const fallBack = () => {
      if (!disposed) {
        setConfig(null);
      }
      releaseSlot();
    };

    const generateFilter = () => {
      if (disposed) {
        return;
      }

      const bounds = surface.getBoundingClientRect();
      if (!slotRef.current) {
        slotRef.current = acquireRefractionSlot();
      }

      const tier = resolveGlassTier({
        isBrowser: true,
        supportsSvgFilters: supportsSvgRefraction(),
        supportsCanvas2d: supportsCanvas2d(),
        prefersReducedMotion: prefersReducedMotion(),
        isLowEndDevice: isLowEndDevice(),
        disabled,
        width: bounds.width,
        height: bounds.height,
        hasRefractionSlot: Boolean(slotRef.current),
      });

      if (tier === "frosted") {
        fallBack();
        return;
      }

      const mapUrl = createDisplacementDataUrl(
        bounds.width,
        bounds.height,
        curvature,
      );
      if (!mapUrl) {
        fallBack();
        return;
      }

      setConfig({
        filterId: createFreshFilterId(),
        height: bounds.height,
        mapUrl,
        width: bounds.width,
      });
      filterGenerated = true;

      if (typeof ResizeObserver !== "undefined" && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          if (resizeHandle !== null) {
            window.clearTimeout(resizeHandle);
          }
          resizeHandle = window.setTimeout(generateFilter, 100);
        });
        resizeObserver.observe(surface);
      }
    };

    const scheduleBackgroundInitialization = (delay: number) => {
      if (disposed) {
        return;
      }

      if (fallbackHandle !== null) {
        window.clearTimeout(fallbackHandle);
      }
      if (idleHandle !== null) {
        window.cancelIdleCallback(idleHandle);
      }

      initializationScheduled = true;

      fallbackHandle = window.setTimeout(() => {
        if (disposed) {
          return;
        }

        if (typeof window.requestIdleCallback === "function") {
          idleHandle = window.requestIdleCallback(() => {
            initializationScheduled = false;
            generateFilter();
          });
        } else {
          initializationScheduled = false;
          generateFilter();
        }
      }, delay);
    };

    const initializeAfterInteraction = () => {
      interactionRequested = true;
      if (!pageLoaded || filterGenerated || disposed) {
        return;
      }
      scheduleBackgroundInitialization(0);
    };

    const observeVisibility = () => {
      if (typeof IntersectionObserver === "undefined") {
        scheduleBackgroundInitialization(POST_LCP_INITIALIZATION_DELAY_MS);
        return;
      }

      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            intersectionObserver?.disconnect();
            if (!initializationScheduled) {
              scheduleBackgroundInitialization(
                POST_LCP_INITIALIZATION_DELAY_MS,
              );
            }
          }
        },
        { rootMargin: "160px", threshold: 0.01 },
      );
      intersectionObserver.observe(surface);
    };

    surface.addEventListener("pointerenter", initializeAfterInteraction, {
      once: true,
    });
    surface.addEventListener("focusin", initializeAfterInteraction, {
      once: true,
    });
    surface.addEventListener("touchstart", initializeAfterInteraction, {
      once: true,
      passive: true,
    });

    if (pageLoaded) {
      observeVisibility();
    } else {
      loadListener = () => {
        pageLoaded = true;
        observeVisibility();
        if (interactionRequested) {
          scheduleBackgroundInitialization(0);
        }
      };
      window.addEventListener("load", loadListener, { once: true });
    }

    if (activated) {
      interactionRequested = true;
      if (pageLoaded) {
        scheduleBackgroundInitialization(0);
      }
    }

    return () => {
      disposed = true;
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      if (idleHandle !== null) {
        window.cancelIdleCallback(idleHandle);
      }
      if (fallbackHandle !== null) {
        window.clearTimeout(fallbackHandle);
      }
      if (resizeHandle !== null) {
        window.clearTimeout(resizeHandle);
      }
      if (loadListener) {
        window.removeEventListener("load", loadListener);
      }
      surface.removeEventListener("pointerenter", initializeAfterInteraction);
      surface.removeEventListener("focusin", initializeAfterInteraction);
      surface.removeEventListener("touchstart", initializeAfterInteraction);
      releaseSlot();
    };
  }, [activated, curvature, disabled]);

  const tier = config ? "refraction" : "frosted";
  const filterRegion = config
    ? calculateFilterRegion(config.width, config.height, strength)
    : null;
  const contentStyle: CSSProperties | undefined = config
    ? {
        filter: `url(#${config.filterId})`,
        WebkitFilter: `url(#${config.filterId})`,
        willChange: "filter",
      }
    : undefined;

  return (
    <FrostedSurface
      ref={surfaceRef}
      variant={variant}
      className={`eq-glass ${className}`.trim()}
      style={style}
      data-glass-tier={tier}
      data-glass-visual-tier="focal"
      {...props}
    >
      {config ? (
        <svg
          aria-hidden="true"
          focusable="false"
          className="eq-glass__filter-definitions"
          data-testid="glass-svg-filter"
        >
          <filter
            id={config.filterId}
            x={filterRegion?.x}
            y={filterRegion?.y}
            width={filterRegion?.width}
            height={filterRegion?.height}
            colorInterpolationFilters="sRGB"
          >
            <feFlood
              floodColor="rgb(128,128,128)"
              floodOpacity="1"
              result="map-bg"
            />
            <feImage
              href={config.mapUrl}
              x="0"
              y="0"
              width={config.width}
              height={config.height}
              preserveAspectRatio="none"
              result="raw-map"
            />
            <feComposite
              in="raw-map"
              in2="map-bg"
              operator="over"
              result="map"
            />
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="0.6"
              result="blurred"
            />
            <feDisplacementMap
              in="blurred"
              in2="map"
              scale={strength * (1 + CHROMA_STAGGER)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="disp-r-raw"
            />
            <feColorMatrix
              in="disp-r-raw"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="disp-r"
            />
            <feDisplacementMap
              in="blurred"
              in2="map"
              scale={strength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="disp-g-raw"
            />
            <feColorMatrix
              in="disp-g-raw"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="disp-g"
            />
            <feDisplacementMap
              in="blurred"
              in2="map"
              scale={strength * (1 - CHROMA_STAGGER)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="disp-b-raw"
            />
            <feColorMatrix
              in="disp-b-raw"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="disp-b"
            />
            <feComposite
              in="disp-r"
              in2="disp-g"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="disp-rg"
            />
            <feComposite
              in="disp-rg"
              in2="disp-b"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lens"
            />
            <feColorMatrix
              in="map"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 -0.5019607843137255"
              result="spec-mask"
            />
            <feGaussianBlur
              in="spec-mask"
              stdDeviation="0.8"
              result="spec"
            />
            <feComposite
              in="spec"
              in2="lens"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
            />
          </filter>
        </svg>
      ) : null}
      {refractedContent ? (
        <>
          <div
            aria-hidden="true"
            className="eq-glass__backing"
            style={contentStyle}
          >
            {refractedContent}
          </div>
          {children ? (
            <div className="eq-glass__foreground">{children}</div>
          ) : null}
        </>
      ) : (
        <div className="eq-glass__content" style={contentStyle}>
          {children}
        </div>
      )}
    </FrostedSurface>
  );
}
