const standards = {
  jurisdiction: ["Dual-jurisdiction structure", "Incorporated entities in Singapore and India provide contract enforcement, IP protection, and cross-border security."],
  iso9001: ["ISO 9001:2015 Certified", "Standardized quality management frameworks across all data ingestion, annotation, and content creation pipelines."],
  iso27001: ["ISO/IEC 27001 Certified", "Data security protocols safeguarding client IP, confidential training datasets, and corporate intelligence."],
  proctored: ["Proctored talent testing", "Contributors prove capability inside monitored, domain-specific evaluation environments, no self-declared resumes."],
  years: ["20+ Years Content services", "Decades of content and academic delivery experience underpin every workflow on the platform"],
} as const;

function TileText({ id }: { id: keyof typeof standards }) {
  const [title, body] = standards[id];
  return (
    <div className="lx-tile__text">
      <h3 className="lx-display">{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function JurisdictionArt() {
  return (
    <svg className="lx-tile__art lx-jur" viewBox="0 0 520 260" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="jur-arc" x1="0" x2="1">
          <stop offset="0" stopColor="#7be8c9" />
          <stop offset="1" stopColor="#e7d3a8" />
        </linearGradient>
        <clipPath id="jur-clip"><circle cx="260" cy="300" r="250" /></clipPath>
      </defs>
      <g clipPath="url(#jur-clip)">
        <circle cx="260" cy="300" r="250" className="lx-jur__globe" />
        <g className="lx-jur__meridians">
          {[34, 104, 174, 244].map((rx) => (
            <ellipse key={rx} cx="260" cy="300" rx={rx} ry="250" className="lx-jur__line" />
          ))}
        </g>
        {[110, 170, 230].map((y) => (
          <line key={y} x1="0" x2="520" y1={y} y2={y} className="lx-jur__line" />
        ))}
      </g>
      <path id="jur-path" d="M168 128 Q 260 10 362 150" className="lx-jur__arc" stroke="url(#jur-arc)" />
      <circle r="4" className="lx-jur__packet">
        <animateMotion dur="3.2s" repeatCount="indefinite" path="M168 128 Q 260 10 362 150" />
      </circle>
      <g className="lx-jur__pin" transform="translate(168 128)">
        <circle r="16" className="lx-jur__ring" />
        <circle r="6" className="lx-jur__dot" />
        <text x="0" y="36" textAnchor="middle">India</text>
      </g>
      <g className="lx-jur__pin lx-jur__pin--b" transform="translate(362 150)">
        <circle r="16" className="lx-jur__ring" />
        <circle r="6" className="lx-jur__dot lx-jur__dot--gold" />
        <text x="0" y="36" textAnchor="middle">Singapore</text>
      </g>
    </svg>
  );
}

function SealArt() {
  return (
    <svg className="lx-tile__art lx-seal" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <path id="seal-circle" d="M80 80 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0" />
      </defs>
      <g className="lx-seal__ring">
        <text><textPath href="#seal-circle">ISO 9001:2015 · ISO 9001:2015 · ISO 9001:2015 ·</textPath></text>
      </g>
      <circle cx="80" cy="80" r="40" className="lx-seal__core" />
      <path d="m64 80 11 11 21-22" className="lx-seal__tick" />
    </svg>
  );
}

function ShieldArt() {
  return (
    <svg className="lx-tile__art lx-shield" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="shield-clip">
          <path d="M80 18 34 36v38c0 30 20 52 46 62 26-10 46-32 46-62V36Z" />
        </clipPath>
      </defs>
      <path d="M80 18 34 36v38c0 30 20 52 46 62 26-10 46-32 46-62V36Z" className="lx-shield__body" />
      <g clipPath="url(#shield-clip)">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1="20" x2="140" y1={30 + i * 13} y2={30 + i * 13} className="lx-shield__grid" />
        ))}
        <rect x="20" y="0" width="120" height="22" className="lx-shield__scan" />
      </g>
      <rect x="66" y="74" width="28" height="22" rx="5" className="lx-shield__lock" />
      <path d="M71 74v-7a9 9 0 0 1 18 0v7" className="lx-shield__lock-arc" />
    </svg>
  );
}

function ProctorArt() {
  return (
    <svg className="lx-tile__art lx-proctor" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <path d="M30 52V36a6 6 0 0 1 6-6h16M108 30h16a6 6 0 0 1 6 6v16M130 108v16a6 6 0 0 1-6 6h-16M52 130H36a6 6 0 0 1-6-6v-16" className="lx-proctor__corner" />
      <circle cx="80" cy="70" r="16" className="lx-proctor__face" />
      <path d="M52 116a28 28 0 0 1 56 0" className="lx-proctor__face" />
      <line x1="38" x2="122" y1="40" y2="40" className="lx-proctor__scan" />
      <circle cx="122" cy="38" r="4" className="lx-proctor__rec" />
    </svg>
  );
}

export function Trust() {
  return (
    <section id="trust" className="lx-section lx-trust" data-home-region aria-labelledby="trust-title">
      <div className="lx-container">
        <header className="lx-head lx-head--center lx-reveal">
          <p className="lx-eyebrow">Trust, security and governance</p>
          <h2 id="trust-title" className="lx-display lx-h2">
            Institutional Governance You Can <span className="lx-serif lx-ink-grad">Rely On</span>
          </h2>
          <p className="lx-lede">Quality, security and accountability across the delivery lifecycle.</p>
        </header>

        <div className="lx-bento">
          <article className="lx-tile lx-tile--jur lx-glass lx-spot lx-reveal" style={{ ["--d" as string]: 0 }}>
            <JurisdictionArt />
            <TileText id="jurisdiction" />
          </article>

          <article className="lx-tile lx-tile--years lx-glass lx-spot lx-reveal" style={{ ["--d" as string]: 1 }}>
            <div className="lx-years" aria-hidden="true">
              <span className="lx-years__num lx-display" data-num="20" />
              <span className="lx-years__rings" />
            </div>
            <TileText id="years" />
          </article>

          <article className="lx-tile lx-glass lx-spot lx-reveal" style={{ ["--d" as string]: 2 }}>
            <SealArt />
            <TileText id="iso9001" />
          </article>

          <article className="lx-tile lx-glass lx-spot lx-reveal" style={{ ["--d" as string]: 3 }}>
            <ShieldArt />
            <TileText id="iso27001" />
          </article>

          <article className="lx-tile lx-glass lx-spot lx-reveal" style={{ ["--d" as string]: 4 }}>
            <ProctorArt />
            <TileText id="proctored" />
          </article>
        </div>
      </div>
    </section>
  );
}
