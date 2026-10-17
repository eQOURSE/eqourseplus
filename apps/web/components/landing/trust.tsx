import type { CSSProperties } from "react";

import { NumberTicker } from "./number-ticker";
import { WorldMap } from "./world-map";

const standards = {
  jurisdiction: ["Dual-Jurisdiction Stability", "Incorporated entities in Singapore and India provide contract enforcement, IP protection, and cross-border security."],
  iso9001: ["ISO 9001:2015 Certified", "Standardized quality management frameworks across all data ingestion, annotation, and content creation pipelines."],
  iso27001: ["ISO 27001:2013 Certified", "Data security protocols safeguarding client IP, confidential training datasets, and corporate intelligence."],
  proctored: ["Proctored Talent Testing", "Contributors prove capability inside monitored, domain-specific evaluation environments, no self-declared resumes."],
  years: ["20+ Years in Content Services", "Decades of content and academic delivery experience underpin every workflow on the platform."],
} as const;

type StandardId = keyof typeof standards;

function TileText({ id }: { id: StandardId }) {
  const [title, body] = standards[id];
  return (
    <div className="q-tile__text">
      <h3 className="q-display">{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function SealArt() {
  return (
    <svg className="q-tile__art q-seal" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <path id="q-seal-ring" d="M80 80 m-60 0 a60 60 0 1 1 120 0 a60 60 0 1 1 -120 0" />
      </defs>
      <g className="q-seal__ring">
        <text><textPath href="#q-seal-ring" textLength={375} lengthAdjust="spacing">QUALITY MANAGEMENT · ISO 9001:2015 · AUDITED · </textPath></text>
      </g>
      <circle cx="80" cy="80" r="38" className="q-seal__core" />
      <path d="m63 80 11 11 22-23" className="q-seal__tick" />
    </svg>
  );
}

function ShieldArt() {
  return (
    <svg className="q-tile__art q-shield" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="q-shield-clip">
          <path d="M80 16 32 35v39c0 31 21 54 48 64 27-10 48-33 48-64V35Z" />
        </clipPath>
      </defs>
      <path d="M80 16 32 35v39c0 31 21 54 48 64 27-10 48-33 48-64V35Z" className="q-shield__body" />
      <g clipPath="url(#q-shield-clip)">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1="20" x2="140" y1={26 + i * 12} y2={26 + i * 12} className="q-shield__grid" />
        ))}
        <rect x="20" y="0" width="120" height="18" className="q-shield__scan" />
      </g>
      <rect x="65" y="74" width="30" height="24" rx="6" className="q-shield__lock" />
      <path d="M71 74v-7a9 9 0 0 1 18 0v7" className="q-shield__arc" />
    </svg>
  );
}

function ProctorArt() {
  return (
    <svg className="q-tile__art q-proctor" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <path d="M28 52V34a6 6 0 0 1 6-6h18M108 28h18a6 6 0 0 1 6 6v18M132 108v18a6 6 0 0 1-6 6h-18M52 132H34a6 6 0 0 1-6-6v-18" className="q-proctor__corner" />
      <circle cx="80" cy="70" r="17" className="q-proctor__face" />
      <path d="M50 118a30 30 0 0 1 60 0" className="q-proctor__face" />
      <line x1="36" x2="124" y1="44" y2="44" className="q-proctor__scan" />
      <circle cx="120" cy="40" r="4.5" className="q-proctor__rec" />
    </svg>
  );
}

const reveal = (index: number) => ({ "--d": index }) as CSSProperties;

export function Trust() {
  return (
    <section id="trust" className="q-section q-section--tint q-trust" data-home-region aria-labelledby="trust-title">
      <div className="q-container">
        <header className="q-head q-head--narrow q-reveal">
          <p className="q-eyebrow"><span className="q-eyebrow__idx">04</span>Trust, security &amp; global infrastructure</p>
          <h2 id="trust-title" className="q-display q-h2">
            Institutional Governance You Can <span className="q-grad">Rely On</span>
          </h2>
        </header>

        <div className="q-bento">
          <article className="q-tile q-tile--jur q-scope-dark q-reveal" style={reveal(0)}>
            <WorldMap />
            <TileText id="jurisdiction" />
          </article>

          <article className="q-tile q-tile--years q-reveal" style={reveal(1)}>
            <div className="q-years" aria-hidden="true">
              <NumberTicker value={20} suffix="+" className="q-years__num q-display" />
              <span className="q-years__unit q-mono">Years · content services</span>
            </div>
            <TileText id="years" />
          </article>

          <article className="q-tile q-tile--seal q-spot q-reveal" style={reveal(2)}>
            <SealArt />
            <TileText id="iso9001" />
          </article>

          <article className="q-tile q-tile--shield q-scope-dark q-reveal" style={reveal(3)}>
            <ShieldArt />
            <TileText id="iso27001" />
          </article>

          <article className="q-tile q-tile--proctor q-reveal" style={reveal(4)}>
            <ProctorArt />
            <TileText id="proctored" />
          </article>
        </div>
      </div>
    </section>
  );
}
