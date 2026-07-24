"use client";

import {
  useEffect,
  useState,
  type HTMLAttributes,
} from "react";

import {
  isLowEndDevice,
  prefersReducedMotion,
} from "../glass/capabilities";

export interface AmbientCanvasProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  paused?: boolean;
}

export function AmbientCanvas({
  className = "",
  paused = false,
  ...props
}: AmbientCanvasProps) {
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion() || isLowEndDevice()) {
      setMotionReady(false);
      return;
    }

    let disposed = false;
    let idleHandle: number | null = null;
    let fallbackHandle: number | null = null;
    let loadListener: (() => void) | null = null;

    const enableMotionWhenIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => {
          if (!disposed) {
            setMotionReady(true);
          }
        });
        return;
      }

      fallbackHandle = window.setTimeout(() => {
        if (!disposed) {
          setMotionReady(true);
        }
      }, 0);
    };

    if (document.readyState === "complete") {
      enableMotionWhenIdle();
    } else {
      loadListener = enableMotionWhenIdle;
      window.addEventListener("load", loadListener, { once: true });
    }

    return () => {
      disposed = true;
      if (idleHandle !== null) {
        window.cancelIdleCallback(idleHandle);
      }
      if (fallbackHandle !== null) {
        window.clearTimeout(fallbackHandle);
      }
      if (loadListener) {
        window.removeEventListener("load", loadListener);
      }
    };
  }, [paused]);

  return (
    <div
      aria-hidden="true"
      className={`eq-ambient-canvas ${className}`.trim()}
      data-ambient-motion={motionReady && !paused ? "running" : "paused"}
      {...props}
    >
      <span className="eq-ambient-canvas__blob eq-ambient-canvas__blob--teal" />
      <span className="eq-ambient-canvas__blob eq-ambient-canvas__blob--mint" />
      <span className="eq-ambient-canvas__blob eq-ambient-canvas__blob--navy" />
      <span className="eq-ambient-canvas__blob eq-ambient-canvas__blob--sky" />
      <span className="eq-ambient-canvas__blob eq-ambient-canvas__blob--teal-300" />
    </div>
  );
}
