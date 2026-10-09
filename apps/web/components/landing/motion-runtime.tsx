"use client";

import { useEffect, useRef } from "react";

function matches(query: string) {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

/**
 * One client island that powers page-wide motion so the section components
 * stay server-rendered: reveal-on-scroll, the scroll-progress bar, pointer
 * spotlights, pointer fields (the hero plus-grid), magnetic CTAs and smooth
 * scrolling. Everything is skipped under prefers-reduced-motion.
 */
export function MotionRuntime() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = matches("(prefers-reduced-motion: reduce)");
    const fine = matches("(hover: hover) and (pointer: fine)");
    const cleanups: Array<() => void> = [];

    // Reveal on scroll
    const reveals = document.querySelectorAll<HTMLElement>(".q-reveal");
    if (reduced || typeof IntersectionObserver === "undefined") {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
      );
      reveals.forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());
    }

    // Scroll progress bar
    let frame = 0;
    const paint = () => {
      frame = 0;
      const bar = progressRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    paint();
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    });

    if (!reduced && fine) {
      // 3D tilt for [data-tilt] cards: --rx / --ry follow the pointer
      let tilted: HTMLElement | null = null;
      const untilt = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        delete el.dataset.tilting;
      };

      // Spotlight cards and pointer fields read the pointer position as CSS vars
      const onPointer = (event: PointerEvent) => {
        const target = event.target as Element | null;
        const tilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
        if (tilt !== tilted) {
          untilt(tilted);
          tilted = tilt;
        }
        if (tilt) {
          const rect = tilt.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          tilt.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
          tilt.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
          tilt.dataset.tilting = "on";
        }
        const spot = target?.closest<HTMLElement>(".q-spot");
        if (spot) {
          const rect = spot.getBoundingClientRect();
          spot.style.setProperty("--mx", `${event.clientX - rect.left}px`);
          spot.style.setProperty("--my", `${event.clientY - rect.top}px`);
        }
        const field = target?.closest<HTMLElement>("[data-pointer-field]");
        if (field) {
          const rect = field.getBoundingClientRect();
          field.style.setProperty("--px", `${event.clientX - rect.left}px`);
          field.style.setProperty("--py", `${event.clientY - rect.top}px`);
          field.dataset.pointer = "on";
        }
      };
      const onLeave = (event: PointerEvent) => {
        const next = event.relatedTarget as Node | null;
        const field = (event.target as Element | null)?.closest<HTMLElement>("[data-pointer-field]");
        if (field && !field.contains(next)) field.dataset.pointer = "off";
        if (tilted && !tilted.contains(next)) {
          untilt(tilted);
          tilted = null;
        }
      };
      document.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerout", onLeave, { passive: true });
      cleanups.push(() => {
        document.removeEventListener("pointermove", onPointer);
        document.removeEventListener("pointerout", onLeave);
      });

      // Magnetic CTAs drift toward the pointer
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const move = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--tx", `${(event.clientX - (rect.left + rect.width / 2)) * 0.16}px`);
          el.style.setProperty("--ty", `${(event.clientY - (rect.top + rect.height / 2)) * 0.26}px`);
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

    // Smooth scrolling on desktop pointers only; touch keeps native momentum
    let disposed = false;
    if (!reduced && fine) {
      void import("lenis").then(({ default: Lenis }) => {
        if (disposed) return;
        const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -96 } });
        let raf = 0;
        const loop = (time: number) => {
          lenis.raf(time);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        cleanups.push(() => {
          cancelAnimationFrame(raf);
          lenis.destroy();
        });
      });
    }

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div
      ref={progressRef}
      className="q-progress"
      style={{ transform: "scaleX(0)" }}
      aria-hidden="true"
    />
  );
}
