"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ComponentType, type RefObject, type SVGProps, useEffect, useId, useRef, useState } from "react";

import {
  IconCheck,
  IconEnterprise,
  IconExpert,
  IconEye,
  IconLayers,
  IconLedger,
  IconVendor,
} from "./icons";

type Tone = "teal" | "mint" | "sky";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const SOURCES: ReadonlyArray<{ title: string; sub: string; chip: string; tone: Tone; icon: Icon }> = [
  { title: "Specialist", sub: "STEM reasoning", chip: "KYC verified", tone: "teal", icon: IconExpert },
  { title: "Vendor agency", sub: "Multilingual team", chip: "Capability reviewed", tone: "mint", icon: IconVendor },
  { title: "Enterprise lab", sub: "Model evaluation", chip: "Work order issued", tone: "sky", icon: IconEnterprise },
];

const STAGES = ["Matching", "Delivering", "Reviewing", "Settling"] as const;

const LEDGER: ReadonlyArray<{ title: string; meta: string; icon: Icon }> = [
  { title: "Milestone approved", meta: "Logged on record", icon: IconCheck },
  { title: "QA feedback shared", meta: "Rubric criteria attached", icon: IconEye },
  { title: "Payout scheduled", meta: "Predictable weekly cycle", icon: IconLedger },
  { title: "Batch accepted", meta: "Client sign-off captured", icon: IconLayers },
];

type Beam = { key: string; d: string; delay: number };

/**
 * Layout box of `el` relative to `root`, from offset geometry so the
 * hero's scroll-driven 3D tilt never skews the connectors.
 */
function boxWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** Measures the rendered cards and draws curved connectors between them. */
function useBeams(stageRef: RefObject<HTMLDivElement>) {
  const [state, setState] = useState<{ w: number; h: number; beams: Beam[] }>({ w: 0, h: 0, beams: [] });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const compute = () => {
      const w = stage.offsetWidth;
      const h = stage.offsetHeight;
      const hubEl = stage.querySelector<HTMLElement>('[data-beam="hub"]');
      const hub = hubEl ? boxWithin(hubEl, stage) : null;
      const ins = Array.from(stage.querySelectorAll<HTMLElement>('[data-beam="in"]'), (el) => boxWithin(el, stage));
      const outs = Array.from(stage.querySelectorAll<HTMLElement>('[data-beam="out"]'), (el) => boxWithin(el, stage));
      const first = ins[0];
      // Connectors only make sense when the board is laid out horizontally.
      if (!hub || !first || w === 0 || first.x + first.w >= hub.x) {
        setState({ w, h, beams: [] });
        return;
      }
      const hubY = hub.y + hub.h / 2;
      const fan = (index: number, count: number) => (index - (count - 1) / 2) * 16;
      const curve = (x1: number, y1: number, x2: number, y2: number) => {
        const dx = (x2 - x1) * 0.55;
        return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + dx).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      };
      const beams: Beam[] = [
        ...ins.map((r, index) => ({
          key: `in-${index}`,
          delay: index * 0.7,
          d: curve(r.x + r.w, r.y + r.h / 2, hub.x + 10, hubY + fan(index, ins.length)),
        })),
        ...outs.map((r, index) => ({
          key: `out-${index}`,
          delay: 1.6 + index * 0.7,
          d: curve(hub.x + hub.w - 10, hubY + fan(index, outs.length), r.x, r.y + r.h / 2),
        })),
      ];
      setState({ w, h, beams });
    };

    compute();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(compute);
    observer?.observe(stage);
    window.addEventListener("resize", compute);
    void document.fonts?.ready.then(compute).catch(() => undefined);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [stageRef]);

  return state;
}

/** Ticks while the board is on screen; idles off-screen and under reduced motion. */
function useLiveTick(rootRef: RefObject<HTMLElement>, interval: number) {
  const reduced = useReducedMotion();
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setLive(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.15 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef]);

  useEffect(() => {
    if (!live || reduced) return;
    const id = window.setInterval(() => setTick((value) => value + 1), interval);
    return () => window.clearInterval(id);
  }, [live, reduced, interval]);

  return { live, tick, reduced };
}

/**
 * Hero product preview: contributors flow through the eQOURSE+ hub into
 * reviewed, observable, on-record outcomes. One image for assistive tech.
 */
export function DeliveryBoard() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gradient = `q-beam-${useId().replace(/:/g, "")}`;
  const { w, h, beams } = useBeams(stageRef);
  const { live, tick, reduced } = useLiveTick(rootRef, 2600);
  const stage = STAGES[tick % STAGES.length];
  const ledger = [0, 1, 2].map((offset) => {
    const id = tick - offset;
    const index = ((id % LEDGER.length) + LEDGER.length) % LEDGER.length;
    return { id, item: LEDGER[index]! };
  });

  return (
    <figure
      ref={rootRef}
      className="q-board"
      data-live={live ? "on" : "off"}
      role="img"
      aria-label="Illustrative preview: verified specialists, vendor agencies and enterprise labs connect through eQOURSE+ to human QA review, live telemetry and an on-record ledger."
    >
      <div className="q-board__bar">
        <span className="q-board__dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="q-board__title">
          <span className="q-dot" />
          Delivery cockpit
        </span>
        <span className="q-board__url q-mono">plus.eqourse.com/cockpit/telemetry-live</span>
        <span className="q-chip q-chip--line q-board__tag">Illustrative preview</span>
      </div>

      <div ref={stageRef} className="q-board__stage">
        <span className="q-plusgrid" />
        <svg className="q-board__beams" width={w} height={h} viewBox={`0 0 ${w || 1} ${h || 1}`} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w || 1} y2="0">
              <stop offset="0" style={{ stopColor: "hsl(var(--q-teal))" }} />
              <stop offset="0.55" style={{ stopColor: "hsl(var(--q-glow))" }} />
              <stop offset="1" style={{ stopColor: "hsl(var(--q-sky))" }} />
            </linearGradient>
          </defs>
          {beams.map((beam) => (
            <g key={beam.key}>
              <path d={beam.d} className="q-beam-base" />
              <path
                d={beam.d}
                pathLength={1000}
                className="q-beam-pulse"
                stroke={`url(#${gradient})`}
                style={{ animationDelay: `${beam.delay}s` }}
              />
            </g>
          ))}
        </svg>

        <div className="q-board__col q-board__col--in">
          {SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <div key={source.title} className="q-node" data-beam="in">
                <span className={`q-node__icon q-tone-${source.tone}`}><Icon /></span>
                <span className="q-node__text">
                  <strong>{source.title}</strong>
                  <small>{source.sub}</small>
                </span>
                <span className="q-node__chip"><IconCheck />{source.chip}</span>
              </div>
            );
          })}
        </div>

        <div className="q-hub" data-beam="hub">
          <span className="q-hub__halo" aria-hidden="true" />
          <span className="q-hub__core">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="q-hub__logo q-hub__logo--light" src="/brand/eqourse-plus-tight.svg" alt="" width={226} height={79} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="q-hub__logo q-hub__logo--dark" src="/brand/eqourse-plus-on-dark-tight.svg" alt="" width={226} height={79} />
          </span>
          <span className="q-hub__stage">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={stage}
                initial={reduced ? false : { y: 8, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={reduced ? undefined : { y: -8, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {stage}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        <div className="q-board__col q-board__col--out">
          <div className="q-node" data-beam="out">
            <span className="q-node__icon q-tone-teal"><IconEye /></span>
            <span className="q-node__text">
              <strong>Rubric review</strong>
              <small>Human QA, feedback on record</small>
            </span>
            <span className="q-meter" aria-hidden="true"><i /></span>
          </div>

          <div className="q-node q-node--telemetry" data-beam="out">
            <span className="q-node__icon q-tone-sky"><IconLayers /></span>
            <span className="q-node__text">
              <strong>Live telemetry</strong>
              <small>Throughput &amp; IAA, visible to clients</small>
            </span>
            <svg className="q-spark" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path className="q-spark__area" d="M2 26 C 14 24, 18 14, 30 16 S 46 26, 58 18 S 76 6, 88 10 S 106 18, 118 4 V 32 H 2 Z" />
              <path className="q-spark__line" d="M2 26 C 14 24, 18 14, 30 16 S 46 26, 58 18 S 76 6, 88 10 S 106 18, 118 4" />
            </svg>
          </div>

          <div className="q-node q-node--ledger" data-beam="out">
            <span className="q-node__head">
              <span className="q-node__icon q-tone-mint"><IconLedger /></span>
              <span className="q-node__text">
                <strong>Personal ledger</strong>
                <small>Every approval, on record</small>
              </span>
            </span>
            <ul className="q-ledger">
              <AnimatePresence initial={false} mode="popLayout">
                {ledger.map(({ id, item }) => {
                  const ItemIcon = item.icon;
                  return (
                    <motion.li
                      key={id}
                      layout={!reduced}
                      initial={reduced ? false : { opacity: 0, y: -14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduced ? undefined : { opacity: 0, scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 340, damping: 30 }}
                    >
                      <span className="q-ledger__icon"><ItemIcon /></span>
                      <span>
                        <b>{item.title}</b>
                        <small>{item.meta}</small>
                      </span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}
