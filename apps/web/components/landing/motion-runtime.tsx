"use client";

import { useEffect, useRef } from "react";

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function finePointer() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/**
 * Single client island that powers page-wide motion so section components
 * can stay server-rendered: smooth scrolling, reveal-on-scroll, pointer
 * spotlight on glass cards, magnetic CTAs and the scroll-progress hairline.
 */
export function MotionRuntime() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const cleanups: Array<() => void> = [];

    // Reveal on scroll
    const reveals = document.querySelectorAll<HTMLElement>(".lx-reveal");
    if (reduced || typeof IntersectionObserver === "undefined") {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      reveals.forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());
    }

    // Scroll progress hairline
    let progressFrame = 0;
    const updateProgress = () => {
      progressFrame = 0;
      const bar = progressRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => {
      if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    if (!reduced && finePointer()) {
      // Spotlight follows the pointer inside any .lx-spot card
      const onPointer = (event: PointerEvent) => {
        const target = (event.target as Element | null)?.closest<HTMLElement>(".lx-spot");
        if (!target) return;
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        target.style.setProperty("--my", `${event.clientY - rect.top}px`);
      };
      document.addEventListener("pointermove", onPointer, { passive: true });
      cleanups.push(() => document.removeEventListener("pointermove", onPointer));

      // Magnetic CTAs drift toward the pointer
      const magnets = document.querySelectorAll<HTMLElement>("[data-magnetic]");
      magnets.forEach((el) => {
        const move = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const x = event.clientX - (rect.left + rect.width / 2);
          const y = event.clientY - (rect.top + rect.height / 2);
          el.style.setProperty("--tx", `${x * 0.18}px`);
          el.style.setProperty("--ty", `${y * 0.28}px`);
        };
        const leave = () => {
          el.style.setProperty("--tx", "0px");
          el.style.setProperty("--ty", "0px");
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    // Smooth scrolling (desktop pointer only; native momentum stays on touch)
    let disposed = false;
    if (!reduced && finePointer()) {
      void import("lenis").then(({ default: Lenis }) => {
        if (disposed) return;
        const lenis = new Lenis({ lerp: 0.085, anchors: { offset: -88 } });
        let frame = 0;
        const raf = (time: number) => {
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
        cleanups.push(() => {
          cancelAnimationFrame(frame);
          lenis.destroy();
        });
      });
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(progressFrame);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <>
      <div ref={progressRef} className="lx-progress" style={{ transform: "scaleX(0)" }} aria-hidden="true" />
      <div className="lx-grain" aria-hidden="true" />
    </>
  );
}
