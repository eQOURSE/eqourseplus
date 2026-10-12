"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { IconCheck, IconClose } from "./icons";

const rows = [
  ["Review process", "Opaque algorithms; silent disqualification", "Documented rubrics, human QA review, clear feedback loops"],
  ["Work flexibility", "Sudden task droughts without notice", "Transparent task availability matched to verified skill tiers"],
  ["Vendor agency model", "Ignored or treated as unauthorized shared accounts", "Formal vendor onboarding, master agreements, team tooling"],
  ["Client visibility", "Blind aggregate data delivered without provenance", "Full telemetry, transparent contributor credentials, live QA dashboards"],
  ["Payment integrity", "Delayed, disputed, or arbitrarily docked payouts", "Milestone locked escrow, transparent ledgers, on-time disbursement"],
] as const;

type Mode = "legacy" | "glass";

/**
 * Exploded-view stack: five operating layers fused into one opaque block in
 * "legacy" mode, separated into labelled glass panes in "glass" mode.
 */
function LayerStack() {
  return (
    <div className="q-stack" aria-hidden="true">
      <div className="q-stack__shadow" />
      {rows.map(([area], index) => (
        <div
          key={area}
          className={`q-stack__layer${index === 0 ? " is-top" : ""}`}
          style={{ "--i": index } as CSSProperties}
        >
          <span className="q-stack__pane">
            {index === 0 ? (
              <>
                <span className="q-stack__q">?</span>
                <span className="q-stack__plus" />
              </>
            ) : null}
          </span>
        </div>
      ))}
      {rows.map(([area], index) => (
        <span key={`label-${area}`} className="q-stack__label" style={{ "--i": index } as CSSProperties}>
          <span className="q-stack__tick"><IconCheck /></span>
          {area}
        </span>
      ))}
      <span className="q-stack__caption q-mono">
        <span className="q-stack__caption-legacy">Black box · nothing to inspect</span>
        <span className="q-stack__caption-glass">Glass box · every layer on record</span>
      </span>
    </div>
  );
}

export function GlassBox() {
  const [mode, setMode] = useState<Mode>("legacy");
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-30% 0px -30% 0px" });
  const reduced = useReducedMotion();

  // The box opens itself the first time the section settles on screen.
  useEffect(() => {
    if (touched) return;
    if (reduced) {
      setMode("glass");
      return;
    }
    if (!inView) return;
    const id = window.setTimeout(() => setMode("glass"), 900);
    return () => window.clearTimeout(id);
  }, [inView, touched, reduced]);

  const choose = (next: Mode) => {
    setTouched(true);
    setMode(next);
  };

  return (
    <div ref={ref} className="q-gb" data-mode={mode}>
      <div className="q-gb__visual">
        <LayerStack />
        <div className="q-switch" role="group" aria-label="Compare operating models">
          <motion.span
            className="q-switch__thumb"
            initial={false}
            animate={{ x: mode === "legacy" ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            aria-hidden="true"
          />
          <button type="button" aria-pressed={mode === "legacy"} onClick={() => choose("legacy")}>
            Legacy platforms
          </button>
          <button type="button" aria-pressed={mode === "glass"} onClick={() => choose("glass")}>
            eQOURSE+ standard
          </button>
        </div>
      </div>

      <table className="q-gb__table">
        <caption className="sr-only">Legacy crowdsourcing platforms compared with the eQOURSE+ glass-box standard</caption>
        <thead>
          <tr>
            <th scope="col">Operational area</th>
            <th scope="col">Legacy crowdsourcing platforms</th>
            <th scope="col">The eQOURSE+ glass-box standard</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([area, legacy, standard], index) => (
            <tr key={area} className="q-gb__row q-reveal" style={{ "--d": index } as CSSProperties}>
              <th scope="row">
                <span className="q-gb__num q-mono" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {area}
              </th>
              <td className="q-gb__legacy" data-label="Legacy platforms">
                <span className="q-gb__mark q-gb__mark--x" aria-hidden="true"><IconClose /></span>
                <span>{legacy}</span>
              </td>
              <td className="q-gb__standard" data-label="eQOURSE+ standard">
                <span className="q-gb__mark" aria-hidden="true"><IconCheck /></span>
                <span>{standard}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
