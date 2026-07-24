"use client";

import { useState } from "react";
import {
  FrostedSurface,
  Glass,
  MotionReveal,
  ThemeToggle,
} from "@eqourse/ui";

function BreakpointIndicator() {
  return (
    <span className="font-semibold text-primary" aria-live="polite">
      <span className="md:hidden">Mobile · base</span>
      <span className="hidden md:inline lg:hidden">Tablet · 768px+</span>
      <span className="hidden lg:inline">Desktop · 1024px+</span>
    </span>
  );
}

function LiveLensContent({ label }: { label: string }) {
  return (
    <div className="relative min-h-64 overflow-hidden rounded-[calc(1.5rem-1px)] bg-background p-7">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35 [background-image:linear-gradient(hsl(var(--primary)/0.24)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.24)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border-[18px] border-accent/70 bg-primary/20 shadow-soft"
      />
      <div className="relative z-10 flex min-h-52 flex-col justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            {label}
          </p>
          <p className="mt-3 max-w-xs font-heading text-2xl font-bold leading-tight text-foreground">
            Live text and geometry remain selectable DOM.
          </p>
        </div>
        <div className="flex items-end gap-2" aria-hidden="true">
          {[42, 68, 52, 88, 62].map((height, index) => (
            <span
              key={height}
              className="w-6 rounded-t-sm bg-gradient-primary"
              style={{
                height,
                opacity: 0.52 + index * 0.1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesignSystemDemo() {
  const [refractionDisabled, setRefractionDisabled] = useState(false);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle,hsl(var(--primary))_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-16 h-[32rem] w-[32rem] rounded-full bg-gradient-primary opacity-15 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <header className="eq-motion-enter flex flex-col gap-8 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              FR-PUB-00 · Internal proof route
            </p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
              Material, theme, and motion lab
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Shared primitives for later public pages. This route validates the
              system; it is not public-page content.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="eq-motion-enter eq-motion-enter--delayed mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>Responsive token</span>
          <BreakpointIndicator />
        </div>

        <section
          className="py-14 sm:py-20"
          aria-labelledby="glass-comparison-title"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Two-tier liquid glass
              </p>
              <h2
                id="glass-comparison-title"
                className="mt-2 font-heading text-3xl font-bold sm:text-4xl"
              >
                Reliable first. Refractive when safe.
              </h2>
            </div>
            <button
              type="button"
              className="self-start rounded-full border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-colors duration-300 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 md:self-auto"
              aria-pressed={refractionDisabled}
              onClick={() => setRefractionDisabled((current) => !current)}
            >
              {refractionDisabled
                ? "Enable automatic refraction"
                : "Disable refraction"}
            </button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span>Tier 1</span>
                <span className="text-primary">SSR · zero JS</span>
              </div>
              <FrostedSurface
                variant="panel"
                className="eq-motion-hover-lift p-2"
              >
                <LiveLensContent label="Frosted surface" />
              </FrostedSurface>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span>Tier 2</span>
                <span className="text-primary">
                  {refractionDisabled ? "Forced fallback" : "Auto-enhanced"}
                </span>
              </div>
              <Glass
                disabled={refractionDisabled}
                variant="panel"
                className="eq-motion-hover-lift p-2"
              >
                <LiveLensContent label="Live refraction" />
              </Glass>
            </div>
          </div>
        </section>

        <MotionReveal
          variant="scale"
          className="border-y border-border py-14 sm:py-20"
          aria-labelledby="motion-title"
        >
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Motion vocabulary
              </p>
              <h2
                id="motion-title"
                className="mt-2 font-heading text-3xl font-bold"
              >
                One entrance, scroll, and hover language.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Emulate reduced motion to make this entire sample static.
              </p>
            </div>
            <div className="eq-motion-hover-lift rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-accent/20 p-8">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="h-px flex-1 bg-border" />
                <span className="h-3 w-3 rounded-full bg-accent" />
              </div>
              <p className="mt-8 font-heading text-xl font-semibold">
                Motion sharpens hierarchy without becoming page content.
              </p>
            </div>
          </div>
        </MotionReveal>

        <footer className="flex flex-col gap-3 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Demo route: noindex, nofollow</span>
          <span>Refraction budget: ≤3 focal elements</span>
        </footer>
      </div>
    </main>
  );
}
