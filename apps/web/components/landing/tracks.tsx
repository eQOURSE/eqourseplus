"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { IconArrow, IconArrowUpRight, IconCheck } from "./icons";

const specializationTracks = [
  ["Language, dialects and multilingual AI", "Dialectical nuance, localisation, transcription and cultural safety across many global languages."],
  ["Advanced STEM and scientific reasoning", "Hallucination detection, paper critique, mathematical proof and physical-science verification."],
  ["Software engineering and code intelligence", "LLM code benchmarking, unit-test debugging, repository evaluation and architecture review."],
  ["Quantitative finance and legal analysis", "Statutory interpretation, financial audit, risk logic and fiscal modelling."],
  ["Clinical medicine and healthcare", "Diagnostic review, pharmacology evaluation, literature synthesis and patient-safety guardrails."],
  ["Curriculum design and enterprise content", "K-12 and higher-education modules, corporate training, assessment and instructional design."],
  ["Robotics, perception and physical AI", "Sensor annotation across LiDAR, radar and video, scenario evaluation, edge-case tagging and spatial data."],
  ["RLHF, preference ranking and red-teaming", "Human feedback ranking, adversarial prompt design, bias mitigation and safety rubric enforcement."],
] as const;

const SIGNALS = [
  ["Verified expertise", "Specialist-led delivery"],
  ["Clear workflows", "Defined project context"],
  ["Accountable delivery", "Visible review standards"],
] as const;

const COUNT = specializationTracks.length;
const pad = (n: number) => String(n).padStart(2, "0");

function position(index: number) {
  const angle = (-90 + (360 / COUNT) * index) * (Math.PI / 180);
  return { x: 50 + Math.cos(angle) * 41, y: 50 + Math.sin(angle) * 41 };
}

export function SpecializationTracks() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const reduced = useReducedMotion();
  const tabsRef = useRef<HTMLDivElement>(null);
  const track = specializationTracks[active] ?? specializationTracks[0];
  const target = position(active);

  useEffect(() => {
    if (!auto || hovering || reduced) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % COUNT), 5200);
    return () => window.clearInterval(id);
  }, [auto, hovering, reduced]);

  // On narrow screens the tabs become a horizontal chip row: keep the active
  // chip in view without moving the page itself.
  useEffect(() => {
    const row = tabsRef.current;
    const chip = row?.querySelectorAll<HTMLElement>('[role="tab"]')[active];
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: chip.offsetLeft - 8, behavior: reduced ? "auto" : "smooth" });
  }, [active, reduced]);

  const choose = (index: number) => {
    setAuto(false);
    setActive(((index % COUNT) + COUNT) % COUNT);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = COUNT - 1;
    if (next === undefined) return;
    event.preventDefault();
    const wrapped = (next + COUNT) % COUNT;
    choose(wrapped);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[wrapped]?.focus();
  };

  return (
    <div
      className="lx-tracks"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <div className="lx-orbit">
        <svg className="lx-orbit__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="lx-beam" gradientUnits="userSpaceOnUse" x1="50" y1="50" x2={target.x} y2={target.y}>
              <stop offset="0" stopColor="#7be8c9" stopOpacity="0.1" />
              <stop offset="1" stopColor="#7be8c9" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="41" className="lx-orbit__ring" />
          <circle cx="50" cy="50" r="30" className="lx-orbit__ring lx-orbit__ring--dash" />
          <circle cx="50" cy="50" r="47" className="lx-orbit__ring lx-orbit__ring--faint" />
          {specializationTracks.map((_, index) => {
            const p = position(index);
            return <line key={index} x1="50" y1="50" x2={p.x} y2={p.y} className="lx-orbit__spoke" />;
          })}
          <motion.line
            x1="50"
            y1="50"
            initial={false}
            animate={{ x2: target.x, y2: target.y }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
            stroke="url(#lx-beam)"
            className="lx-orbit__beam"
          />
        </svg>

        <div className="lx-orbit__core">
          <span className="lx-orbit__core-halo" aria-hidden="true" />
          <span className="lx-orbit__core-text">eQOURSE<span>+</span></span>
          <small>Verified network</small>
        </div>

        <div ref={tabsRef} className="lx-orbit__nodes" role="tablist" aria-label="Specialization tracks">
          {specializationTracks.map(([title], index) => {
            const p = position(index);
            const selected = active === index;
            return (
              <button
                key={title}
                type="button"
                role="tab"
                id={`specialization-track-${index}`}
                aria-selected={selected}
                aria-controls="specialization-detail"
                tabIndex={selected ? 0 : -1}
                className="lx-node"
                style={{ ["--x" as string]: `${p.x}%`, ["--y" as string]: `${p.y}%` }}
                onClick={() => choose(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className="lx-node__num">{pad(index + 1)}</span>
                <span className="lx-node__label">{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <article
        id="specialization-detail"
        role="tabpanel"
        aria-labelledby={`specialization-track-${active}`}
        className="lx-track lx-glass lx-spot"
      >
        <div className="lx-track__top">
          <span>SPECIALIZATION TRACK</span>
          <b><i aria-hidden="true" />VERIFIED NETWORK</b>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, y: -12, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lx-track__content"
          >
            <span className="lx-track__big" aria-hidden="true">{pad(active + 1)}</span>
            <h3 className="lx-display">{track[0]}</h3>
            <p>{track[1]}</p>
          </motion.div>
        </AnimatePresence>
        <div className="lx-track__signals" aria-label="Track delivery qualities">
          {SIGNALS.map(([title, sub]) => (
            <div key={title}>
              <span aria-hidden="true"><IconCheck /></span>
              <strong>{title}</strong>
              <small>{sub}</small>
            </div>
          ))}
        </div>
        <div className="lx-track__foot">
          <span>Track {pad(active + 1)} of {pad(COUNT)}</span>
          <div className="lx-track__nav">
            <span className="lx-track__progress" aria-hidden="true">
              <i key={`${active}-${auto && !hovering}`} data-running={auto && !hovering && !reduced} />
            </span>
            <button type="button" aria-label="Previous track" onClick={() => choose(active - 1)}>
              <IconArrow style={{ transform: "scaleX(-1)" }} />
            </button>
            <button type="button" aria-label="Next track" onClick={() => choose(active + 1)}>
              <IconArrow />
            </button>
          </div>
        </div>
        <Link href="/freelancers" className="lx-link lx-track__cta">
          More for freelancers <IconArrowUpRight width={16} height={16} />
        </Link>
      </article>
    </div>
  );
}
