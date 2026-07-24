"use client";

import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";

export type MotionRevealVariant = "up" | "scale";

export interface MotionRevealProps
  extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  variant?: MotionRevealVariant;
}

export function MotionReveal({
  children,
  className = "",
  variant = "up",
  ...props
}: MotionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.16 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`eq-motion-reveal eq-motion-reveal--${variant} ${className}`.trim()}
      data-visible={visible}
      {...props}
    >
      {children}
    </div>
  );
}
