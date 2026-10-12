"use client";

import { useEffect, useRef } from "react";

type NumberTickerProps = {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

/**
 * Purely visual count-up. The server renders the final value, so crawlers,
 * no-JS visitors and reduced-motion users always read the real figure; the
 * parent supplies the accessible text.
 */
export function NumberTicker({ value, suffix = "", duration = 1600, className }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined" || typeof requestAnimationFrame !== "function") {
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = `${Math.round(value * eased)}${suffix}`;
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        el.textContent = `0${suffix}`;
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {value}
      {suffix}
    </span>
  );
}
