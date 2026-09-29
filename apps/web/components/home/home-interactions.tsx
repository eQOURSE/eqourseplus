"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import styles from "./home-redesign.module.css";

const personas = [
  { label: "Company or Project Team", title: "Hire verified talent", copy: "Build accountable project teams for AI data, content, and tutoring delivery.", href: "/register/client", cta: "Register a company" },
  { label: "Specialist or Domain Expert", title: "Join verified AI data projects", copy: "Complete verification and skill testing to enter the specialist talent network.", href: "/register/freelancer", cta: "Join as a specialist" },
  { label: "Vendor Agency", title: "Bring your delivery team", copy: "Register your agency for structured project staffing and delivery opportunities.", href: "/register/vendor", cta: "Register an agency" },
] as const;

export function PersonaSwitcher() {
  const [active, setActive] = useState(0);
  const persona = personas[active] ?? personas[0];
  return (
    <div className={styles.personaArea}>
      <div className={styles.personaTabs} aria-label="Choose your eQOURSE+ path">
        {personas.map((item, index) => <button key={item.label} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{item.label}</button>)}
      </div>
      <div className={styles.personaCopy} aria-live="polite"><strong>{persona.title}</strong><span>{persona.copy}</span><Link href={persona.href}>{persona.cta} →</Link></div>
    </div>
  );
}

const capabilities = [
  ["Language & Linguistics", "Phonetics, semantics, low-resource vernaculars", ["RLHF response ranking", "Multilingual preference data", "Cultural nuance evaluation"]],
  ["Science & STEM", "Post-doctoral reasoning, chemistry, quantum physics", ["Scientific reasoning", "Technical evaluation", "Expert validation"]],
  ["Coding & Technology", "Fullstack architecture, security analysis, code synthesis", ["Code generation review", "Security analysis", "Technical QA"]],
  ["Finance & Mathematics", "Actuarial models, derivatives, complex financial proofs", ["Quantitative reasoning", "Financial evaluation", "Proof validation"]],
  ["Medical & Healthcare", "Clinical diagnostics, radiology annotation, Bio-NLP", ["Clinical annotation", "Medical evaluation", "Bio-NLP review"]],
  ["Education & Curriculum", "Pedagogical scaffolding, rubric validation, syllabus", ["Curriculum design", "Rubric validation", "Learning evaluation"]],
  ["Autonomous Vehicles", "LiDAR dimensional bounding, trajectory verification, radar tags", ["Sensor annotation", "Trajectory review", "Quality validation"]],
  ["Robotics & Spatial AI", "Kinematic motion sets, affordance mapping", ["Spatial annotation", "Motion validation", "Affordance review"]],
  ["Quality Assurance & Red Teaming", "Adversarial testing, jailbreak mitigation, alignment", ["Safety evaluation", "Red teaming", "Alignment review"]],
] as const;

export function CapabilityExplorer() {
  const [active, setActive] = useState(0);
  const item = capabilities[active] ?? capabilities[0];
  return (
    <div className={styles.capabilityExplorer}>
      <div className={styles.capabilityTabs} role="tablist" aria-label="Specialist domains">
        {capabilities.map(([title, copy], index) => <button key={title} type="button" role="tab" aria-selected={active === index} aria-controls="capability-panel" id={`capability-tab-${index}`} onClick={() => setActive(index)}><span><strong>{title}</strong><small>{title === "Autonomous Vehicles" ? <>LiDAR <i className={styles.inlineValue} data-value="3D" /> bounding, trajectory verification, radar tags</> : copy}</small></span><i aria-hidden="true">→</i></button>)}
      </div>
      <div className={styles.capabilityPanel} role="tabpanel" id="capability-panel" aria-labelledby={`capability-tab-${active}`}>
        <div className={styles.domainTier}>DOMAIN SPECIALIST NETWORK</div>
        <h3>{item[0]}</h3>
        <p>{item[0] === "Autonomous Vehicles" ? <>LiDAR <i className={styles.inlineValue} data-value="3D" /> 
        bounding, trajectory verification, radar tags</> : 
        item[1]}
        </p>
        <ul>{item[2].map((detail) => <li key={detail}><span aria-hidden="true">✓</span>{detail}</li>)}</ul>
        <Link href="/freelancers">Explore verified specialists →</Link>
      </div>
    </div>
  );
}

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

const workflowOrbitNodes = [
  ["01", "Understand", "⌁"],
  ["02", "Plan", "▤"],
  ["03", "Develop", "□"],
  ["04", "Communicate", "◌"],
  ["05", "Quality Check", "✓"],
  ["06", "Deliver", "↗"],
  ["07", "Feedback", "✦"],
] as const;

export function WorkflowOrbit() {
  const [active, setActive] = useState(0);
  const activeNode = workflowOrbitNodes[active] ?? workflowOrbitNodes[0];

  return (
    <div className={styles.workflowOrbit} data-workflow-orbit="true">
      <div className={styles.workflowOrbitGlow} aria-hidden="true" />
      <div className={styles.workflowOrbitTrack} role="group" aria-label="eQOURSE+ delivery workflow">
        <div className={styles.workflowOrbitPath} aria-hidden="true" />
        {workflowOrbitNodes.map(([number, title, icon], index) => (
          <button
            key={number}
            type="button"
            className={styles.workflowOrbitNode}
            data-workflow-node
            aria-pressed={active === index}
            aria-label={`${number} ${title}`}
            style={{ "--orbit-angle": `${(index / workflowOrbitNodes.length) * 360}deg` } as CSSProperties}
            onClick={() => setActive(index)}
          >
            <span className={styles.workflowOrbitNodeContent}>
              <span className={styles.workflowOrbitNodeCounter} data-workflow-node-counter>
                <span className={styles.workflowOrbitNodeFace} aria-hidden="true">{icon}</span>
                <small>{number}</small>
                <strong>{title}</strong>
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className={styles.workflowOrbitCenter} data-workflow-center aria-label="eQOURSE Strategy" aria-live="polite">
        <span>eQOURSE</span>
        <strong>Strategy</strong>
        <small>{activeNode?.[1]}</small>
      </div>
    </div>
  );
}

export function SpecializationTracks() {
  const [active, setActive] = useState(0);
  const track = specializationTracks[active] ?? specializationTracks[0];

  return (
    <div className={styles.specializationExplorer}>
      <div className={styles.specializationList} role="tablist" aria-label="Specialization tracks">
        {specializationTracks.map(([title], index) => (
          <button
            key={title}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="specialization-detail"
            id={`specialization-track-${index}`}
            onClick={() => setActive(index)}
          >
            <span className={styles.specializationNumber}>{String(index + 1).padStart(2, "0")}</span>
            <span>{title}</span>
            <i aria-hidden="true">→</i>
          </button>
        ))}
      </div>
      <article
        id="specialization-detail"
        role="tabpanel"
        aria-labelledby={`specialization-track-${active}`}
        className={`${styles.specializationDetail} eq-frosted eq-frosted--card`}
      >
        <div className={styles.specializationDetailTop}>
          <span>SPECIALIZATION TRACK</span>
          <b>VERIFIED NETWORK</b>
        </div>
        <h3>{track[0]}</h3>
        <p>{track[1]}</p>
        <div className={styles.specializationSignals} aria-label="Track delivery qualities">
          <div><span aria-hidden="true">✓</span><strong>Verified expertise</strong><small>Specialist-led delivery</small></div>
          <div><span aria-hidden="true">✓</span><strong>Clear workflows</strong><small>Defined project context</small></div>
          <div><span aria-hidden="true">✓</span><strong>Accountable delivery</strong><small>Visible review standards</small></div>
        </div>
        <div className={styles.specializationFooter}>
          <span>Track {String(active + 1).padStart(2, "0")} of {String(specializationTracks.length).padStart(2, "0")}</span>
          <span aria-hidden="true">✦</span>
        </div>
      </article>
    </div>
  );
}

export type PillarExplorerItem = {
  title: string;
  body: string;
  bullets: readonly string[];
  cta: string;
  href: string;
  more?: string;
  moreHref?: string;
};

export function PillarExplorer({ items }: { items: readonly PillarExplorerItem[] }) {
  const SCROLL_STEP_PX = 220;
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const explorerRef = useRef<HTMLDivElement>(null);
  const scrollDistanceRef = useRef(0);
  const sectionActiveRef = useRef(false);
  const item = items[active] ?? items[0];

  const selectActive = (next: number) => {
    activeRef.current = next;
    setActive(next);
  };

  useEffect(() => {
    const explorer = explorerRef.current;
    if (!explorer || items.length < 2) return;

    const onWheel = (event: WheelEvent) => {
      const rect = explorer.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const sectionIsActive = rect.top <= viewportHeight * 0.58 && rect.bottom >= viewportHeight * 0.42;

      if (!sectionIsActive) {
        sectionActiveRef.current = false;
        scrollDistanceRef.current = 0;
        if (rect.top > viewportHeight * 0.58 && activeRef.current !== 0) selectActive(0);
        return;
      }

      if (event.deltaY === 0) return;
      if (!sectionActiveRef.current) {
        sectionActiveRef.current = true;
        scrollDistanceRef.current = 0;
        if (activeRef.current !== 0) selectActive(0);
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const atBoundary = (direction < 0 && activeRef.current === 0) ||
        (direction > 0 && activeRef.current === items.length - 1);
      if (atBoundary) {
        scrollDistanceRef.current = 0;
        return;
      }

      event.preventDefault();
      scrollDistanceRef.current += event.deltaY;
      const steps = Math.floor(Math.abs(scrollDistanceRef.current) / SCROLL_STEP_PX);
      if (steps > 0) {
        const next = Math.min(
          items.length - 1,
          Math.max(0, activeRef.current + direction * steps),
        );
        scrollDistanceRef.current %= SCROLL_STEP_PX;
        selectActive(next);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [items.length]);

  if (!item) return null;

  return (
    <div ref={explorerRef} className={styles.specializationExplorer} data-scroll-switch="true">
      <div className={styles.specializationList} data-scroll-options="vertical" role="tablist" aria-label="eQOURSE+ delivery paths">
        {items.map((entry, index) => (
          <button
            key={entry.title}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="pillar-detail"
            id={`pillar-track-${index}`}
            onClick={() => selectActive(index)}
          >
            <span className={styles.specializationNumber}>{String(index + 1).padStart(2, "0")}</span>
            <span>{entry.title}</span>
            <i aria-hidden="true">→</i>
          </button>
        ))}
      </div>
      <article
        id="pillar-detail"
        role="tabpanel"
        aria-live="polite"
        aria-labelledby={`pillar-track-${active}`}
        className={`${styles.specializationDetail} eq-frosted eq-frosted--card`}
      >
        <div className={styles.specializationDetailTop}>
          <span>DELIVERY PATH</span>
          <b>TRANSPARENT BY DESIGN</b>
        </div>
        <h3>{item.title}</h3>
        <p>{item.body}</p>
        <div className={styles.specializationSignals} aria-label={`${item.title} benefits`}>
          {item.bullets.slice(0, 3).map((bullet) => (
            <div key={bullet}>
              <span aria-hidden="true">✓</span>
              <strong>{bullet.split(":")[0]}</strong>
              <small>{bullet.includes(":") ? bullet.slice(bullet.indexOf(":") + 1).trim() : bullet}</small>
            </div>
          ))}
        </div>
        <div className={styles.specializationFooter}>
          <Link className="home-text-link" href={item.href}>{item.cta} <span aria-hidden="true">→</span></Link>
          <span aria-hidden="true">✦</span>
        </div>
      </article>
    </div>
  );
}
