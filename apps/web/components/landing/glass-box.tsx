"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { IconCheck, IconClose } from "./icons";

const rows = [
  ["Review process", "Opaque algorithms; silent disqualification", "Documented rubrics, human QA review, clear feedback loops"],
  ["Work flexibility", "Sudden task droughts without notice", "Transparent task availability matched to verified skill tiers"],
  ["Vendor agency model", "Ignored or treated as unauthorized shared accounts", "Formal vendor onboarding, master agreements, team tooling"],
  ["Client visibility", "Blind aggregate data delivered without provenance", "Full telemetry, transparent contributor credentials, live QA dashboards"],
  ["Payment integrity", "Delayed, disputed, or arbitrarily docked payouts", "Milestone locked escrow, transparent ledgers, on-time disbursement"],
] as const;

type Mode = "legacy" | "glass";

const FACES = ["front", "back", "right", "left", "top", "bottom"] as const;

function Cube({ mode }: { mode: Mode }) {
  return (
    <div className="lx-cube-scene" data-mode={mode} aria-hidden="true">
      <div className="lx-cube">
        {FACES.map((face) => (
          <span key={face} className={`lx-cube__face lx-cube__face--${face}`} />
        ))}
        <span className="lx-cube__orbit" />
      </div>
      <span className="lx-cube__core" />
      <div className="lx-cube-shadow" />
    </div>
  );
}

export function GlassBox() {
  const [mode, setMode] = useState<Mode>("legacy");
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-30% 0px -30% 0px" });
  const reduced = useReducedMotion();

  // The box opens itself the first time the section takes focus on screen.
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
    <div ref={ref} className="lx-gb" data-mode={mode}>
      <div className="lx-gb__visual">
        <Cube mode={mode} />
        <div className="lx-switch lx-glass" role="group" aria-label="Compare operating models">
          <motion.span
            className="lx-switch__lens"
            initial={false}
            animate={{ x: mode === "legacy" ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
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

      <table className="lx-gb__table">
        <thead>
          <tr>
            <th scope="col">Operational area</th>
            <th scope="col">Legacy crowdsourcing platforms</th>
            <th scope="col">The eQOURSE+ glass-box standard</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([area, legacy, standard], index) => (
            <tr key={area} className="lx-gb__row lx-reveal" style={{ ["--d" as string]: index }}>
              <th scope="row">
                <span className="lx-gb__num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {area}
              </th>
              <td className="lx-gb__legacy" data-label="Legacy platforms">
                <span className="lx-gb__mark lx-gb__mark--x" aria-hidden="true"><IconClose /></span>
                <span>{legacy}</span>
              </td>
              <td className="lx-gb__standard" data-label="eQOURSE+ standard">
                <span className="lx-gb__mark" aria-hidden="true"><IconCheck /></span>
                <span>{standard}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
