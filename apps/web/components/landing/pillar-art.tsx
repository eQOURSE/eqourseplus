/* Decorative, CSS-animated SVG scenes for each audience pillar. */

export function ExpertArt() {
  return (
    <svg className="lx-art lx-art--expert" viewBox="0 0 400 320" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="art-e-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#7be8c9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0f9b8e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="160" r="70" fill="url(#art-e-core)" className="lx-art__pulse" />
      <g className="lx-art__spin" style={{ transformOrigin: "200px 160px" }}>
        <ellipse cx="200" cy="160" rx="150" ry="56" className="lx-art__orbit" />
        <circle cx="350" cy="160" r="6" className="lx-art__node" />
        <circle cx="62" cy="182" r="4" className="lx-art__node lx-art__node--gold" />
      </g>
      <g className="lx-art__spin lx-art__spin--rev" style={{ transformOrigin: "200px 160px" }}>
        <ellipse cx="200" cy="160" rx="110" ry="110" className="lx-art__orbit lx-art__orbit--dash" transform="rotate(-24 200 160)" />
        <circle cx="200" cy="50" r="5" className="lx-art__node" />
        <circle cx="290" cy="225" r="3.5" className="lx-art__node lx-art__node--gold" />
      </g>
      <g className="lx-art__spin lx-art__spin--slow" style={{ transformOrigin: "200px 160px" }}>
        <ellipse cx="200" cy="160" rx="132" ry="40" className="lx-art__orbit" transform="rotate(58 200 160)" />
        <circle cx="270" cy="275" r="4" className="lx-art__node" />
      </g>
      <circle cx="200" cy="146" r="16" className="lx-art__glyph" />
      <path d="M170 196a30 30 0 0 1 60 0" className="lx-art__glyph" />
    </svg>
  );
}

export function VendorArt() {
  const nodes = [
    [70, 70], [70, 160], [70, 250],
    [330, 70], [330, 160], [330, 250],
  ] as const;
  return (
    <svg className="lx-art lx-art--vendor" viewBox="0 0 400 320" aria-hidden="true" focusable="false">
      {nodes.map(([x, y], i) => (
        <path
          key={`l${i}`}
          d={`M${x} ${y} C ${x < 200 ? x + 80 : x - 80} ${y}, ${x < 200 ? 140 : 260} 160, 200 160`}
          className="lx-art__wire"
          style={{ animationDelay: `${i * -0.45}s` }}
        />
      ))}
      <rect x="160" y="120" width="80" height="80" rx="22" className="lx-art__hub" />
      <path d="M186 160h28M200 146v28" className="lx-art__glyph" />
      {nodes.map(([x, y], i) => (
        <g key={`n${i}`} className="lx-art__bob" style={{ animationDelay: `${i * -0.7}s` }}>
          <circle cx={x} cy={y} r="20" className="lx-art__seat" />
          <circle cx={x} cy={y - 4} r="5" className="lx-art__glyph" />
          <path d={`M${x - 9} ${y + 10}a9 9 0 0 1 18 0`} className="lx-art__glyph" />
        </g>
      ))}
    </svg>
  );
}

export function EnterpriseArt() {
  return (
    <svg className="lx-art lx-art--enterprise" viewBox="0 0 400 320" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="art-x-sweep" x1="0" x2="1">
          <stop offset="0" stopColor="#e7d3a8" stopOpacity="0" />
          <stop offset="1" stopColor="#e7d3a8" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {[40, 80, 120].map((r) => (
        <circle key={r} cx="200" cy="160" r={r} className="lx-art__orbit" />
      ))}
      <path d="M200 160 L 200 40 A 120 120 0 0 1 304 100 Z" fill="url(#art-x-sweep)" className="lx-art__radar" style={{ transformOrigin: "200px 160px" }} />
      {[
        [260, 92], [142, 112], [238, 214], [120, 196], [296, 168],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" className="lx-art__blip" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      <g transform="translate(300 230)">
        {[22, 36, 28, 46, 40].map((h, i) => (
          <rect key={i} x={i * 14} y={-h} width="9" height={h} rx="3" className="lx-art__bar" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </g>
      <circle cx="200" cy="160" r="7" className="lx-art__node lx-art__node--gold" />
    </svg>
  );
}
