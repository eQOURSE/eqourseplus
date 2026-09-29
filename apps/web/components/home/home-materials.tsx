"use client";

import { Glass, GlassSegmentedControl } from "@eqourse/ui";
import { useState } from "react";
import { approvedHome } from "../../content/approved-home";
import styles from "./approved-homepage.module.css";

const options = [
  { value: "expert", label: "For Freelance Experts" },
  { value: "agency", label: "For Vendor Agencies" },
  { value: "enterprise", label: "For Enterprise Clients" },
] as const;
const destinations = ["/register/freelancer", "/register/vendor", "/register/client"];

export function AudienceSelector() {
  const [audience, setAudience] = useState<string>("expert");
  return <div className={styles.audience}>
    <GlassSegmentedControl aria-label="Choose your audience" options={options} value={audience} onValueChange={setAudience} className={styles.audienceControl} />
    {options.map((option, index) => <div key={option.value} className={styles.audienceAction} hidden={audience !== option.value}>
      <a className={styles.primaryButton} href={destinations[index]}>{(approvedHome.audiences[index] ?? "").split(": ").slice(1).join(": ").replace(/ →$/, "")} <span aria-hidden="true">↗</span></a>
    </div>)}
  </div>;
}

function StreamField() {
  return <svg viewBox="0 0 400 320" width="400" height="320" fill="none" aria-hidden="true">
    {Array.from({ length: 13 }, (_, index) => <path key={index} d={`M -50 ${55 + index * 17} C 70 ${-45 + index * 19}, 185 ${410 - index * 11}, 460 ${-20 + index * 20}`} stroke="currentColor" strokeWidth={index % 3 === 0 ? 2 : 1} opacity={.3 + index * .035} />)}
    <circle cx="200" cy="160" r="100" stroke="currentColor" opacity=".65" />
    <circle cx="200" cy="160" r="72" stroke="currentColor" opacity=".35" />
  </svg>;
}

export function LiquidArtwork({ compact = false }: { compact?: boolean }) {
  return <div className={`${styles.artwork} ${compact ? styles.compactArtwork : ""}`} aria-hidden="true">
    <div className={styles.artHalo} />
    <div className={styles.streamField}><StreamField /></div>
    <Glass activated className={styles.flowLens} curvature={65} strength={22} refractedContent={<div className={styles.lensField}><StreamField /></div>}>
      <span className={styles.lensMark}>+</span>
    </Glass>
    <div className={styles.orbitOne} /><div className={styles.orbitTwo} />
    <span className={styles.artLabel}>eQOURSE<span>+</span></span>
  </div>;
}

export function SpecializationTracks() {
  const [selected, setSelected] = useState(0);
  const tracks = approvedHome.tracks.slice(1);
  return <div className={styles.tracks}>
    <div className={styles.trackRail} aria-label="Specialization tracks">
      {tracks.map((track, index) => <button type="button" key={track} className={styles.trackButton} aria-pressed={selected === index} aria-controls={`track-${index}`} onClick={() => setSelected(index)}>
        <span>{track.split(": ")[0]}</span><span aria-hidden="true">↗</span>
      </button>)}
    </div>
    <div className={styles.trackReading}>
      <LiquidArtwork compact />
      {tracks.map((track, index) => <div id={`track-${index}`} key={track} hidden={selected !== index} className={styles.trackDetail}>
        <h3>{track.split(": ")[0]}</h3><p>{track.split(": ").slice(1).join(": ")}</p>
        <a className={styles.textLink} href="/register/freelancer">Start Your Expert Application <span aria-hidden="true">↗</span></a>
      </div>)}
    </div>
  </div>;
}
