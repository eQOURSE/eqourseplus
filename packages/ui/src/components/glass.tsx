"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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
import { createDisplacementDataUrl } from "../glass/displacement-map";
import {
  FrostedSurface,
  type FrostedSurfaceProps,
} from "./frosted-surface";

export interface GlassProps extends FrostedSurfaceProps {
  disabled?: boolean;
  strength?: number;
}

interface RefractionConfig {
  filterId: string;
  mapUrl: string;
}

const POST_LCP_INITIALIZATION_DELAY_MS = 12000;

let filterRevision = 0;

function createFreshFilterId(): string {
  filterRevision += 1;
  return `eqourse-glass-filter-${filterRevision}`;
}

export function Glass({
  children,
  className = "",
  disabled = false,
  strength = 22,
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

      const mapUrl = createDisplacementDataUrl(bounds.width, bounds.height);
      if (!mapUrl) {
        fallBack();
        return;
      }

      setConfig({
        filterId: createFreshFilterId(),
        mapUrl,
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
  }, [disabled, strength]);

  const tier = config ? "refraction" : "frosted";
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
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={config.mapUrl}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="displacement-map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement-map"
              scale={strength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />

            <feOffset
              in="SourceAlpha"
              dx="0.8"
              dy="0"
              result="primary-offset"
            />
            <feComposite
              in="primary-offset"
              in2="SourceAlpha"
              operator="out"
              result="primary-edge"
            />
            <feFlood
              floodColor="#0F9B8E"
              floodOpacity="0.2"
              result="primary-flood"
            />
            <feComposite
              in="primary-flood"
              in2="primary-edge"
              operator="in"
              result="primary-fringe"
            />

            <feOffset
              in="SourceAlpha"
              dx="-0.8"
              dy="0"
              result="accent-offset"
            />
            <feComposite
              in="accent-offset"
              in2="SourceAlpha"
              operator="out"
              result="accent-edge"
            />
            <feFlood
              floodColor="#7BE8C9"
              floodOpacity="0.18"
              result="accent-flood"
            />
            <feComposite
              in="accent-flood"
              in2="accent-edge"
              operator="in"
              result="accent-fringe"
            />

            <feSpecularLighting
              in="SourceAlpha"
              surfaceScale="2"
              specularConstant="0.28"
              specularExponent="18"
              lightingColor="#FFFFFF"
              result="specular"
            >
              <fePointLight x="-120" y="-160" z="240" />
            </feSpecularLighting>
            <feComposite
              in="specular"
              in2="SourceAlpha"
              operator="in"
              result="specular-clipped"
            />
            <feBlend
              in="refracted"
              in2="primary-fringe"
              mode="screen"
              result="with-primary-fringe"
            />
            <feBlend
              in="with-primary-fringe"
              in2="accent-fringe"
              mode="screen"
              result="with-fringe"
            />
            <feBlend
              in="with-fringe"
              in2="specular-clipped"
              mode="screen"
            />
          </filter>
        </svg>
      ) : null}
      <div className="eq-glass__content" style={contentStyle}>
        {children}
      </div>
    </FrostedSurface>
  );
}
