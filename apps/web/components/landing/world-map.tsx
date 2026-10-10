"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { LAND_COLS, LAND_MASK, LAND_ROWS } from "./world-dots.data";
import { INDIA_OUTLINE_PATH, WORLD_COAST_PATH } from "./world-vector.data";

/*
 * Equirectangular world map, 2 viewBox units per degree:
 * longitude -180..180 -> x 0..720, latitude 75..-57 -> y 0..264.
 * The stage is a fixed 2.4:1 box with "slice" scaling, so the full height is
 * always visible and the same horizontal band is cropped at every width.
 */
const W = 720;
const H = 264;
const LAT_TOP = 75;
const STAGE_ASPECT = 2.4;
const VISIBLE_W = STAGE_ASPECT * H;
const VISIBLE_LEFT = (W - VISIBLE_W) / 2;

type Point = readonly [number, number];

function project(lon: number, lat: number): Point {
  return [(lon + 180) * 2, (LAT_TOP - lat) * 2];
}

function decodeMask(): string {
  return typeof atob === "function" ? atob(LAND_MASK) : Buffer.from(LAND_MASK, "base64").toString("binary");
}

const MASK = decodeMask();

function cellIsLand(r: number, c: number): boolean {
  if (r < 0 || r >= LAND_ROWS || c < 0 || c >= LAND_COLS) return false;
  const i = r * LAND_COLS + c;
  return ((MASK.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1) === 1;
}

/** Whether the map grid cell nearest to a coordinate is land. */
export function landAt(lon: number, lat: number): boolean {
  const r = Math.round((74 - lat) / 2);
  const c = Math.round((lon + 179 - (r % 2)) / 2);
  return cellIsLand(r, c);
}

/** One zero-length, round-capped subpath per land cell renders as a dot. */
function landPath(): string {
  let d = "";
  for (let r = 0; r < LAND_ROWS; r += 1) {
    const lat = 74 - 2 * r;
    for (let c = 0; c < LAND_COLS; c += 1) {
      if (cellIsLand(r, c)) {
        const [x, y] = project(-179 + 2 * c + (r % 2), lat);
        d += `M${x} ${y}h0`;
      }
    }
  }
  return d;
}

const LAND = landPath();

// Geographic reference points (decimal degrees).
const INDIA = { lon: 78.9629, lat: 20.5937 };
const SINGAPORE = { lon: 103.8198, lat: 1.3521 };

// Camera: start on the whole world, then settle on the India–Singapore corridor.
const S_WORLD = 0.86;
// The close frame retains India's northern extent and Singapore's southern position.
const S_ZOOM = 2.65;
const MID = project((INDIA.lon + SINGAPORE.lon) / 2, (INDIA.lat + SINGAPORE.lat) / 2);
const ZOOM_X = VISIBLE_LEFT + VISIBLE_W * 0.55 - S_ZOOM * MID[0];
const ZOOM_Y = H * 0.57 - S_ZOOM * MID[1];
const WORLD_X = (W - W * S_WORLD) / 2;
const WORLD_Y = (H - H * S_WORLD) / 2;

const zoomed = ([x, y]: Point): Point => [ZOOM_X + S_ZOOM * x, ZOOM_Y + S_ZOOM * y];
const IN = zoomed(project(INDIA.lon, INDIA.lat));
const SG = zoomed(project(SINGAPORE.lon, SINGAPORE.lat));

// Arc bowing north-east of the chord, like a flight path over the Bay of Bengal.
const CHORD: Point = [SG[0] - IN[0], SG[1] - IN[1]];
const CHORD_LEN = Math.hypot(CHORD[0], CHORD[1]);
const BULGE = CHORD_LEN * 0.28;
const CTRL: Point = [
  (IN[0] + SG[0]) / 2 + (CHORD[1] / CHORD_LEN) * BULGE,
  (IN[1] + SG[1]) / 2 - (CHORD[0] / CHORD_LEN) * BULGE,
];
const ARC = `M${IN[0].toFixed(1)} ${IN[1].toFixed(1)} Q${CTRL[0].toFixed(1)} ${CTRL[1].toFixed(1)} ${SG[0].toFixed(1)} ${SG[1].toFixed(1)}`;
// apex of the quadratic curve (t = 0.5)
const APEX: Point = [(IN[0] + 2 * CTRL[0] + SG[0]) / 4, (IN[1] + 2 * CTRL[1] + SG[1]) / 4];

/** Position on the stage, as percentages, for HTML labels that keep a fixed size. */
const at = ([x, y]: Point) =>
  ({ left: `${(((x - VISIBLE_LEFT) / VISIBLE_W) * 100).toFixed(2)}%`, top: `${((y / H) * 100).toFixed(2)}%` }) as CSSProperties;

const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const PARALLELS = [60, 30, -30];

/**
 * Motion graphic for the dual-jurisdiction tile: a dotted world map that
 * zooms into India and Singapore, pins both, and links them with a live arc.
 * Server HTML shows the final framed state; with JavaScript it starts on the
 * whole world and plays once when half of it is on screen.
 */
export function WorldMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--q-map-world": `translate(${WORLD_X.toFixed(1)}px, ${WORLD_Y.toFixed(1)}px) scale(${S_WORLD})`,
    "--q-map-zoom": `translate(${ZOOM_X.toFixed(1)}px, ${ZOOM_Y.toFixed(1)}px) scale(${S_ZOOM})`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className="q-map"
      data-inview={inView ? "true" : "false"}
      style={style}
      role="img"
      aria-label="World map with India and Singapore pinned and linked, showing the dual-jurisdiction structure."
    >
      <svg className="q-map__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="q-map-land" gradientUnits="userSpaceOnUse" cx={MID[0]} cy={MID[1]} r="300">
            <stop offset="0" stopColor="hsl(163 70% 72%)" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="hsl(170 55% 55%)" stopOpacity="0.6" />
            <stop offset="1" stopColor="hsl(180 25% 60%)" stopOpacity="0.22" />
          </radialGradient>
        </defs>
        <g className="q-map__zoom">
          <g className="q-map__grid">
            {MERIDIANS.map((lon) => {
              const x = project(lon, 0)[0];
              return <line key={`m${lon}`} x1={x} x2={x} y1={0} y2={H} />;
            })}
            {PARALLELS.map((lat) => {
              const y = project(0, lat)[1];
              return <line key={`p${lat}`} x1={0} x2={W} y1={y} y2={y} />;
            })}
            <line className="q-map__equator" x1={0} x2={W} y1={project(0, 0)[1]} y2={project(0, 0)[1]} />
          </g>
          <path className="q-map__coast" d={WORLD_COAST_PATH} />
          <path className="q-map__land" d={LAND} stroke="url(#q-map-land)" />
          <path className="q-map__india" d={INDIA_OUTLINE_PATH} />
        </g>
      </svg>

      <svg className="q-map__svg q-map__overlay" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="q-map-arc" gradientUnits="userSpaceOnUse" x1={IN[0]} y1={IN[1]} x2={SG[0]} y2={SG[1]}>
            <stop offset="0" stopColor="hsl(163 70% 70%)" />
            <stop offset="1" stopColor="hsl(199 88% 72%)" />
          </linearGradient>
        </defs>
        <path className="q-map__arc-base" d={ARC} />
        <path className="q-map__arc" d={ARC} pathLength={1} stroke="url(#q-map-arc)" />
        <path className="q-map__arc-flow" d={ARC} pathLength={100} />
        {/* Packets run from document start (the negative begin offsets the
            return trip by half a cycle); the overlay stays hidden until the
            camera lands, so they never show before then. */}
        <circle className="q-map__packet" r="2.8">
          <animateMotion dur="3.4s" begin="0s" repeatCount="indefinite" path={ARC} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1" />
        </circle>
        <circle className="q-map__packet q-map__packet--back" r="2.2">
          <animateMotion dur="3.4s" begin="-1.7s" repeatCount="indefinite" path={ARC} keyPoints="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1" />
        </circle>
      </svg>

      <div className="q-map__scan" aria-hidden="true" />

      <div className="q-map__layer" aria-hidden="true">
        <span className="q-map__pin q-map__pin--in" style={at(IN)}>
          <i />
          <span className="q-map__label q-map__label--left">
            <b>India</b>
            <small>Incorporated entity</small>
          </span>
        </span>
        <span className="q-map__pin q-map__pin--sg" style={at(SG)}>
          <i />
          <span className="q-map__label q-map__label--right">
            <b>Singapore</b>
            <small>Incorporated entity</small>
          </span>
        </span>
        <span className="q-map__chip" style={at(APEX)}>Dual governance</span>
      </div>
    </div>
  );
}
