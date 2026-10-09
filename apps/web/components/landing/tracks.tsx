"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  type ComponentType,
  type CSSProperties,
  type RefObject,
  type SVGProps,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  IconArrow,
  IconArrowUpRight,
  IconAtom,
  IconBook,
  IconCheck,
  IconClose,
  IconCode,
  IconLanguage,
  IconPulse,
  IconRadar,
  IconRank,
  IconScale,
  IconSearch,
} from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
export type TrackId = "language" | "stem" | "code" | "legal" | "clinical" | "curriculum" | "robotics" | "rlhf";

interface Track {
  id: TrackId;
  title: string;
  body: string;
  icon: Icon;
  /** Extra search terms people use for this kind of expertise. */
  keywords: readonly string[];
}

const TRACKS: readonly Track[] = [
  {
    id: "language",
    title: "Language, Dialects & Multilingual AI",
    body: "Dialectical nuances, localization, transcription, and cultural safety across 30+ global languages.",
    icon: IconLanguage,
    keywords: ["linguist", "linguistics", "translation", "translator", "localisation", "speech", "audio", "voice", "accent", "hindi", "tamil", "telugu", "bengali", "marathi", "urdu", "arabic", "spanish", "french", "german", "japanese", "chinese", "mandarin", "korean", "portuguese"],
  },
  {
    id: "stem",
    title: "Advanced STEM & Scientific Reasoning",
    body: "Hallucination detection, paper critiques, mathematical proofs, and physical science verification.",
    icon: IconAtom,
    keywords: ["science", "scientist", "math", "maths", "mathematics", "calculus", "algebra", "statistics", "physics", "chemistry", "biology", "research", "phd", "reasoning", "astronomy"],
  },
  {
    id: "code",
    title: "Software Engineering & Code Intelligence",
    body: "LLM code benchmarking, unit test debugging, repository evaluations, and architecture reviews.",
    icon: IconCode,
    keywords: ["coding", "programming", "developer", "engineer", "python", "javascript", "typescript", "java", "c++", "c#", "golang", "rust", "sql", "react", "node", "backend", "frontend", "devops"],
  },
  {
    id: "legal",
    title: "Quantitative Finance & Legal Analysis",
    body: "Statutory compliance interpretation, financial audits, risk logic assessment, and fiscal modeling.",
    icon: IconScale,
    keywords: ["quant", "accounting", "accountant", "auditor", "tax", "cfa", "cpa", "banking", "investment", "economics", "law", "lawyer", "attorney", "contract", "contracts", "regulatory", "policy"],
  },
  {
    id: "clinical",
    title: "Clinical Medicine & Healthcare",
    body: "Diagnostic reviews, pharmacology evaluations, literature synthesis, and patient safety guardrails.",
    icon: IconPulse,
    keywords: ["medical", "doctor", "physician", "mbbs", "nurse", "nursing", "clinic", "health", "pharmacy", "pharmacist", "radiology", "radiologist", "diagnosis", "dentist", "surgery", "biomedical"],
  },
  {
    id: "curriculum",
    title: "Curriculum Design & Enterprise Content",
    body: "K-12 and higher-ed modules, corporate training, assessments, and technical instructional design.",
    icon: IconBook,
    keywords: ["teacher", "teaching", "tutor", "education", "educator", "edtech", "k12", "school", "university", "lecturer", "professor", "course", "elearning", "writer", "writing", "editor"],
  },
  {
    id: "robotics",
    title: "Robotics, Perception & Physical AI",
    body: "Sensor annotation (LiDAR, Radar, Video), scenario evaluation, edge-case tagging, and spatial data.",
    icon: IconRadar,
    keywords: ["robot", "autonomous", "self-driving", "camera", "computer vision", "vision", "cv", "sensor", "3d", "point cloud", "labeling", "labelling", "mapping", "drone"],
  },
  {
    id: "rlhf",
    title: "RLHF, Preference Ranking & Red-Teaming",
    body: "Human feedback ranking, adversarial prompt crafting, bias mitigation, and safety rubric enforcement.",
    icon: IconRank,
    keywords: ["red team", "redteaming", "rater", "evaluator", "evaluation", "alignment", "jailbreak", "trust", "rubric", "ai trainer", "llm", "chatbot"],
  },
];

const EXAMPLES = ["Python", "Hindi", "Radiology", "Contract law", "Calculus", "LiDAR", "Red-teaming", "Curriculum"] as const;
const TYPED = ["Python", "Hindi transcription", "Radiology", "Contract law", "Calculus proofs", "LiDAR annotation", "Red-teaming", "K-12 curriculum"] as const;
const FALLBACK_PLACEHOLDER = "e.g. Python, Hindi, radiology";

const pad = (n: number) => String(n).padStart(2, "0");

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .trim();
}

// Words each track can be found by: its approved copy plus common job terms.
const INDEX: ReadonlyMap<TrackId, readonly string[]> = new Map(
  TRACKS.map((track) => [
    track.id,
    normalize([track.title, track.body, ...track.keywords].join(" ")).split(" "),
  ]),
);

/** Every typed term must be the start of some indexed word. */
export function trackMatches(id: TrackId, query: string): boolean {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const words = INDEX.get(id) ?? [];
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

/* ---------- live task previews, sized for the cards ---------- */

const WAVE = [0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.55, 0.3, 0.65, 0.85, 0.45, 0.7, 0.95, 0.4, 0.6, 0.8, 0.5, 0.35, 0.7, 0.55, 0.9, 0.4, 0.65, 0.3, 0.5, 0.8, 0.6, 0.45];

// Deterministic "point cloud" so server and client render identically.
const CLOUD = Array.from({ length: 70 }, (_, index) => {
  const x = (index * 37 + 11) % 97;
  const y = (index * 53 + 7) % 89;
  return { x: 3 + x * 0.94, y: 5 + y * 0.97, s: 2 + ((index * 7) % 3) };
});

function Vignette({ id }: { id: TrackId }) {
  switch (id) {
    case "language":
      return (
        <div className="q-vg q-vg--language">
          <div className="q-vg__wave">
            {WAVE.map((height, index) => (
              <i key={index} style={{ "--h": height, "--i": index } as CSSProperties} />
            ))}
          </div>
          <div className="q-vg__lines">
            <p><b className="q-mono">HI</b><span>नमस्ते, आज का पाठ शुरू करते हैं</span></p>
            <p><b className="q-mono">EN</b><span>Hello, let&apos;s begin today&apos;s lesson</span><mark>Reviewed</mark></p>
          </div>
        </div>
      );
    case "stem":
      return (
        <div className="q-vg q-vg--stem">
          <div className="q-vg__eq">
            <span>∇ · E = ρ / ε₀</span>
            <small className="q-mono">Derivation · step check</small>
          </div>
          <span className="q-vg__tag"><IconCheck />Step verified</span>
        </div>
      );
    case "code":
      return (
        <div className="q-vg q-vg--code">
          <pre className="q-mono">
            <span className="k">def</span> <span className="f">evaluate</span>(answer):{"\n"}
            {"  "}<span className="k">assert</span> passes(answer){"\n"}
            {"  "}<span className="k">return</span> rubric(answer)
          </pre>
          <span className="q-vg__tag"><IconCheck />Tests passing</span>
        </div>
      );
    case "legal":
      return (
        <div className="q-vg q-vg--legal">
          <div className="q-vg__doc">
            <i /><i /><i className="is-hl" /><i /><i className="is-short" />
          </div>
          <span className="q-vg__tag q-vg__tag--sky">Clause flagged · statute cited</span>
        </div>
      );
    case "clinical":
      return (
        <div className="q-vg q-vg--clinical">
          <div className="q-vg__case">
            <b>Case review</b>
            <svg viewBox="0 0 160 36" aria-hidden="true" focusable="false">
              <path className="q-ecg" d="M0 20h38l8-14 10 26 9-18 6 6h89" />
              <path className="q-ecg q-ecg--pulse" d="M0 20h38l8-14 10 26 9-18 6 6h89" pathLength={100} />
            </svg>
          </div>
          <span className="q-vg__tag"><IconCheck />Safety guardrail applied</span>
        </div>
      );
    case "curriculum":
      return (
        <div className="q-vg q-vg--curriculum">
          <ol className="q-vg__outline">
            <li data-done="true">Module overview</li>
            <li data-done="true">Lesson plan</li>
            <li>Assessment items</li>
          </ol>
          <span className="q-vg__tag"><IconCheck />Outcomes mapped</span>
        </div>
      );
    case "robotics":
      return (
        <div className="q-vg q-vg--robotics">
          <div className="q-vg__cloud">
            {CLOUD.map((dot, index) => (
              <i key={index} style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: dot.s, height: dot.s }} />
            ))}
            <span className="q-vg__box"><b className="q-mono">Pedestrian · occluded</b></span>
            <span className="q-vg__sweep" />
          </div>
        </div>
      );
    case "rlhf":
      return (
        <div className="q-vg q-vg--rlhf">
          <div className="q-vg__resp is-pick">
            <b>Response A</b>
            <i /><i /><i className="is-short" />
            <span className="q-chip q-chip--mint"><IconCheck />Preferred</span>
          </div>
          <div className="q-vg__resp">
            <b>Response B</b>
            <i /><i /><i className="is-short" />
            <span className="q-chip q-chip--line">Bias flagged</span>
          </div>
        </div>
      );
  }
}

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Types example skills into the empty search box while it is on screen. */
function useTypewriter(inputRef: RefObject<HTMLInputElement>, active: boolean) {
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (!active || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      input.placeholder = FALLBACK_PLACEHOLDER;
      return;
    }
    let word = 0;
    let chars = 0;
    let deleting = false;
    let timer = 0;
    let visible = false;
    const step = () => {
      timer = 0;
      if (!visible) return;
      const text = TYPED[word % TYPED.length] ?? "";
      chars += deleting ? -1 : 1;
      input.placeholder = text.slice(0, Math.max(0, chars)) || " ";
      let wait = deleting ? 38 : 82;
      if (!deleting && chars >= text.length) {
        deleting = true;
        wait = 1500;
      } else if (deleting && chars <= 0) {
        deleting = false;
        word += 1;
        wait = 380;
      }
      timer = window.setTimeout(step, wait);
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !timer) step();
    });
    observer.observe(input);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      input.placeholder = FALLBACK_PLACEHOLDER;
    };
  }, [inputRef, active]);
}

/** Moves a soft spotlight from card to card while the grid is on screen and idle. */
function useShowcase(rootRef: RefObject<HTMLElement>, idle: boolean, reduced: boolean) {
  const [inView, setInView] = useState(false);
  const [spot, setSpot] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootRef]);

  const running = inView && idle && !reduced;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSpot((value) => (value + 1) % TRACKS.length), 2600);
    return () => window.clearInterval(id);
  }, [running]);

  return running ? spot : -1;
}

/**
 * "Find your domain": type a skill and the matching specialization tracks
 * light up and move to the front. All eight tracks stay in the server HTML.
 */
export function SpecializationTracks() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reduced = Boolean(useReducedMotion());
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `q-dm-${useId().replace(/:/g, "")}`;
  const searching = query.trim() !== "";

  useTypewriter(inputRef, query === "" && !focused);
  const spot = useShowcase(rootRef, !searching && !hovering, reduced);

  const matched = useMemo(
    () => new Set(TRACKS.filter((track) => trackMatches(track.id, query)).map((track) => track.id)),
    [query],
  );
  // Matching tracks move to the front; the rest keep their order behind them.
  const ordered = useMemo(
    () =>
      searching
        ? [...TRACKS.filter((track) => matched.has(track.id)), ...TRACKS.filter((track) => !matched.has(track.id))]
        : TRACKS,
    [searching, matched],
  );

  const status = !searching
    ? "Showing all eight specialization tracks."
    : matched.size > 0
      ? `${matched.size} of ${TRACKS.length} tracks match “${query.trim()}”.`
      : `No track matches “${query.trim()}” yet. Try a broader skill, like coding or medicine.`;

  return (
    <div ref={rootRef} className="q-dm">
      <div className="q-dm__console">
        <div className="q-dm__search q-glass" data-focused={focused}>
          <span className="q-dm__search-icon" aria-hidden="true"><IconSearch /></span>
          <label htmlFor={inputId} className="sr-only">Search specialization tracks by your expertise</label>
          <span className="q-dm__prefix" aria-hidden="true">I specialise in</span>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={FALLBACK_PLACEHOLDER}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {searching ? (
            <button type="button" className="q-dm__clear" aria-label="Clear search" onClick={() => setQuery("")}>
              <IconClose />
            </button>
          ) : (
            <span className="q-dm__hint q-mono" aria-hidden="true">Type a skill</span>
          )}
        </div>

        <div className="q-dm__try">
          <span className="q-dm__try-label">Try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="q-dm__example"
              aria-pressed={normalize(query) === normalize(example)}
              onClick={() => setQuery(example)}
            >
              {example}
            </button>
          ))}
        </div>

        <p className="q-dm__status" role="status">
          <span className="q-dot" aria-hidden="true" />
          {status}
        </p>
      </div>

      <div
        className="q-dm__grid"
        data-searching={searching}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
      >
        {ordered.map((track) => {
          const index = TRACKS.indexOf(track);
          const Icon = track.icon;
          const hit = searching && matched.has(track.id);
          return (
            <motion.article
              key={track.id}
              layout={reduced ? false : "position"}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className={`q-dom q-dom--${track.id}`}
              data-track={track.id}
              data-match={!searching ? "all" : hit ? "yes" : "no"}
              data-spot={spot === index ? "on" : undefined}
            >
              <div className="q-dom__card q-spot" data-tilt>
                {hit ? <span className="q-dom__beam" aria-hidden="true" /> : null}
                <div className="q-dom__visual" aria-hidden="true">
                  <Vignette id={track.id} />
                </div>
                <div className="q-dom__body">
                  <div className="q-dom__meta">
                    <span className="q-dom__icon" aria-hidden="true"><Icon /></span>
                    {hit ? <span className="q-dom__badge"><IconCheck />Match</span> : null}
                    <span className="q-dom__num q-mono">{pad(index + 1)}</span>
                  </div>
                  <h3 className="q-display q-dom__title">{track.title}</h3>
                  <p className="q-dom__desc">{track.body}</p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="q-dm__foot">
        <Link href="/register/freelancer" className="q-btn q-btn--primary" data-magnetic>
          Apply as an Expert
          <span className="q-btn__icon"><IconArrow /><IconArrow /></span>
        </Link>
        <Link href="/freelancers" className="q-link">
          More for freelancers <IconArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
