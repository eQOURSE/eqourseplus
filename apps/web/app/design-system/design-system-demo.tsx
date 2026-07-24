"use client";

import { useEffect, useState } from "react";
import {
  AmbientCanvas,
  FrostedSurface,
  Glass,
  GlassButton,
  GlassNav,
  GlassSegmentedControl,
  ThemeToggle,
  isLowEndDevice,
  prefersReducedMotion,
} from "@eqourse/ui";

const labViews = [
  { value: "material", label: "Material" },
  { value: "motion", label: "Motion" },
  { value: "access", label: "Access" },
] as const;

type LabView = (typeof labViews)[number]["value"];

function BreakpointIndicator() {
  return (
    <span className="font-semibold text-primary" aria-live="polite">
      <span className="md:hidden">Mobile · base</span>
      <span className="hidden md:inline lg:hidden">Tablet · 768px+</span>
      <span className="hidden lg:inline">Desktop · 1024px+</span>
    </span>
  );
}

function AmbientBacking({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-background ${
        compact ? "min-h-36" : "min-h-56"
      }`}
    >
      <span className="absolute -left-10 -top-8 h-40 w-40 rounded-full bg-[#0F9B8E]/60 blur-[60px]" />
      <span className="absolute -right-8 top-4 h-36 w-36 rounded-full bg-[#7BE8C9]/60 blur-[60px]" />
      <span className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#38bdf8]/50 blur-[60px]" />
      <span className="absolute bottom-2 right-1/4 h-28 w-28 rounded-full bg-[#5eead4]/50 blur-[60px]" />
      <span className="absolute inset-x-0 bottom-0 h-16 bg-[#232145]/40 blur-[60px]" />
      <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,hsl(var(--accent)/0.18),transparent)]" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  id,
  title,
}: {
  eyebrow: string;
  id: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>
      <h2
        className="mt-2 font-heading text-3xl font-bold tracking-[-0.025em] sm:text-4xl"
        id={id}
      >
        {title}
      </h2>
    </div>
  );
}

export function DesignSystemDemo() {
  const [ambientPaused, setAmbientPaused] = useState(false);
  const [focalProofActive, setFocalProofActive] = useState(false);
  const [labView, setLabView] = useState<LabView>("material");
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    setMotionAllowed(!prefersReducedMotion() && !isLowEndDevice());
  }, []);

  return (
    <main
      className="eq-liquid-glass-demo relative isolate min-h-screen overflow-hidden bg-background/60 px-5 py-5 text-foreground sm:px-8 sm:py-8"
      data-motion={motionAllowed ? "enabled" : "static"}
    >
      <AmbientCanvas paused={ambientPaused} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[1] opacity-[0.04] [background-image:radial-gradient(circle,hsl(var(--primary))_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <GlassNav
          aria-label="Design system lab"
        >
          <a
            className="font-heading text-sm font-extrabold tracking-[-0.02em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            href="#lab"
          >
            eQOURSE<span className="text-primary">+</span>
          </a>
          <div className="hidden items-center gap-5 text-xs font-semibold text-muted-foreground sm:flex">
            <a className="hover:text-foreground" href="#components">
              Components
            </a>
            <a className="hover:text-foreground" href="#tiers">
              Tiers
            </a>
            <a className="hover:text-foreground" href="#budget">
              Budget
            </a>
          </div>
          <ThemeToggle />
        </GlassNav>

        <header
          className="grid min-h-[calc(100svh-7rem)] content-center gap-10 border-b border-border py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
          id="lab"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              FR-PUB-00A · Internal proof route
            </p>
            <h1 className="mt-4 max-w-3xl font-heading text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Liquid glass,
              <span className="block text-primary">under control.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A component lab for material, motion, fallback, and access. No
              public-page content lives here.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <GlassButton
                aria-pressed={ambientPaused}
                onClick={() => setAmbientPaused((current) => !current)}
              >
                {ambientPaused ? "Resume ambient motion" : "Pause ambient motion"}
              </GlassButton>
              <GlassButton
                aria-pressed={focalProofActive}
                onClick={() => setFocalProofActive(true)}
              >
                {focalProofActive ? "Focal budget active" : "Activate focal proof"}
              </GlassButton>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span>Responsive token</span>
              <BreakpointIndicator />
              <span>Route: noindex, nofollow</span>
            </div>
          </div>

          <FrostedSurface
            glassTier="clear"
            variant="panel"
            className="relative min-h-[22rem] overflow-hidden p-3"
          >
            <AmbientBacking />
            <div className="absolute inset-x-8 bottom-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Ambient canvas
              </p>
              <p className="mt-2 max-w-sm font-heading text-2xl font-bold">
                Five authorized colors. CSS transforms and opacity only.
              </p>
            </div>
          </FrostedSurface>
        </header>

        <section
          aria-labelledby="components-title"
          className="border-b border-border py-16 sm:py-24"
          id="components"
        >
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <SectionHeading
              eyebrow="Component family"
              id="components-title"
              title="Tactile, sharp, operable."
            />

            <div className="space-y-8">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Real labels above an aria-hidden backing copy
                </p>
                <GlassSegmentedControl
                  activated={focalProofActive}
                  aria-label="Lab view"
                  onValueChange={setLabView}
                  options={labViews}
                  value={labView}
                />
                <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
                  Selected:{" "}
                  <span className="font-semibold text-foreground">
                    {labViews.find((view) => view.value === labView)?.label}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <GlassButton>Primary glass action</GlassButton>
                <span className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Pointer specular updates only during interaction; the tactile
                  press uses the Gel easing.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="tiers-title"
          className="border-b border-border py-16 sm:py-24"
          id="tiers"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Material tiers"
              id="tiers-title"
              title="Regular. Clear. Focal."
            />
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Distinct transparency and blur levels, with real displacement
              reserved for small focal moments.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <FrostedSurface
              className="min-h-64 p-7"
              data-testid="glass-tier-regular"
              glassTier="regular"
              variant="panel"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Regular · 18px
              </p>
              <p className="mt-5 font-heading text-2xl font-bold">
                Navigation and readable surfaces.
              </p>
            </FrostedSurface>

            <FrostedSurface
              className="min-h-64 p-7"
              data-testid="glass-tier-clear"
              glassTier="clear"
              variant="panel"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Clear · 8px
              </p>
              <p className="mt-5 font-heading text-2xl font-bold">
                Values remain visible through the material.
              </p>
            </FrostedSurface>

            <Glass
              activated={focalProofActive}
              className="eq-glass-runtime min-h-64"
              data-focal-candidate="2"
              refractedContent={<AmbientBacking />}
              strength={22}
              variant="panel"
            >
              <div className="relative min-h-64 p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Focal · 24px + displacement
                </p>
                <p className="mt-5 max-w-xs font-heading text-2xl font-bold">
                  Ambient color bends; foreground copy stays sharp.
                </p>
              </div>
            </Glass>
          </div>
        </section>

        <section
          aria-labelledby="budget-title"
          className="py-16 sm:py-24"
          id="budget"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Performance guard"
              id="budget-title"
              title="Three focal slots. Never four."
            />
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Activate the proof above. The fourth simultaneous candidate
              remains frosted by the shared FR-PUB-00 budget.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Glass
              activated={focalProofActive}
              className="eq-glass-runtime min-h-52"
              data-focal-candidate="3"
              refractedContent={<AmbientBacking compact />}
              strength={18}
              variant="panel"
            >
              <div className="relative min-h-52 p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Candidate 3
                </p>
                <p className="mt-5 font-heading text-2xl font-bold">
                  Final available focal slot.
                </p>
              </div>
            </Glass>

            <Glass
              activated={focalProofActive}
              className="eq-glass-runtime min-h-52"
              data-expected-tier="frosted"
              data-focal-candidate="4"
              data-testid="focal-budget-candidate-4"
              refractedContent={<AmbientBacking compact />}
              strength={18}
              variant="panel"
            >
              <div className="relative min-h-52 p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Candidate 4 · fallback
                </p>
                <p className="mt-5 font-heading text-2xl font-bold">
                  Frosted automatically when the budget is full.
                </p>
              </div>
            </Glass>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-border py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Internal component proof · not FR-PUB-01</span>
          <span>Reduced motion and low-end devices stay static/frosted</span>
        </footer>
      </div>
    </main>
  );
}
