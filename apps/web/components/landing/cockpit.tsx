"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";

const metrics = [
  { label: "Active Specialists", value: 88, suffix: "", change: "Interface", spark: [3, 5, 4, 6, 7, 6, 9] },
  { label: "Active Vendor Teams", value: 50, suffix: "", change: "Interface", spark: [2, 3, 5, 4, 6, 7, 7] },
  { label: "First Pass Yield", value: 80, suffix: "%", change: "Interface", spark: [5, 6, 5, 7, 6, 8, 8] },
  { label: "Deliverables YTD", value: 90, suffix: "%", change: "Interface", spark: [1, 3, 4, 6, 6, 8, 9] },
] as const;

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const throughput = [48, 66, 84, 88, 80, 38, 42];

const quality = [
  ["Audit Protocol", "Automated + Human"],
  ["Avg Turnaround", "12.3 days"],
  ["First Pass Yield", "96.8%"],
  ["Calibration Accuracy", "98.5%"],
] as const;

type Graph = "bar" | "line" | "pie";

const graphTabs: ReadonlyArray<{ id: Graph; label: string }> = [
  { id: "bar", label: "Bar chart" },
  { id: "line", label: "Line chart" },
  { id: "pie", label: "Pie chart" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({ to, suffix = "", run }: { to: number; suffix?: string; run: boolean }) {
  const [value, setValue] = useState(to);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!run || reduced) {
      setValue(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1600);
      const eased = 1 - Math.pow(2, -10 * t);
      setValue(Math.round(to * (t === 1 ? 1 : eased)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, reduced, to]);

  return <>{value}{suffix}</>;
}

function Spark({ points }: { points: readonly number[] }) {
  const max = Math.max(...points);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * 100} ${30 - (p / max) * 26}`)
    .join(" ");
  return (
    <svg className="cp-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L 100 32 L 0 32 Z`} className="cp-spark__area" />
      <path d={d} className="cp-spark__line" />
    </svg>
  );
}

export function CockpitPreview() {
  const [graph, setGraph] = useState<Graph>("bar");
  const tabsId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "-15% 0px" });
  const activeTab = `${tabsId}-${graph}-tab`;
  const panelId = `${tabsId}-panel`;

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % graphTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + graphTabs.length) % graphTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = graphTabs.length - 1;
    if (nextIndex === undefined) return;
    const nextTab = graphTabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    setGraph(nextTab.id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  }

  return (
    <section ref={rootRef} className="cockpit cp" aria-label="Live cockpit interface preview">
      <div className="cp-bar">
        <div className="cp-dots" aria-hidden="true"><span /><span /><span /></div>
        <code className="cp-url"><span aria-hidden="true">⌁</span>plus.eqourse.com/cockpit/telemetry-live</code>
        <span className="cp-tools">Workspace preview</span>
      </div>

      <div className="cp-body">
        <div className="cp-rail" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} data-active={i === 1} />)}
        </div>

        <div className="cp-main">
          <div className="cp-head">
            <div>
              <div className="cp-title">
                <strong>Live Cockpit</strong>
                <span className="cp-live">● Preview</span>
              </div>
              <small>Illustrative pipeline calibration &amp; specialist telemetry interface</small>
            </div>
            <div className="cp-actions">
              <span className="cp-range">Last 30 days</span>
              <button type="button" className="cp-btn">Export run manifest</button>
            </div>
          </div>

          <div className="cp-metrics">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                className="cp-metric"
                initial={false}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.001, y: 14 }}
                transition={{ duration: 0.8, delay: 0.1 + index * 0.08, ease: EASE }}
              >
                <small>{metric.label}</small>
                <p>
                  <strong><CountUp to={metric.value} suffix={metric.suffix} run={inView} /></strong>
                  <em>{metric.change}</em>
                </p>
                <Spark points={metric.spark} />
              </motion.div>
            ))}
          </div>

          <div className="cp-grid">
            <div className="cp-card">
              <div className="cp-card__top">
                <strong>Throughput trend &amp; SLA calibrations</strong>
                <div className="cp-tabs" role="tablist" aria-label="Chart type">
                  {graphTabs.map((tab, index) => (
                    <button
                      aria-controls={panelId}
                      aria-selected={graph === tab.id}
                      data-active={graph === tab.id}
                      id={`${tabsId}-${tab.id}-tab`}
                      key={tab.id}
                      onClick={() => setGraph(tab.id)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      role="tab"
                      tabIndex={graph === tab.id ? 0 : -1}
                      type="button"
                    >
                      {graph === tab.id ? (
                        <motion.span layoutId={`${tabsId}-pill`} className="cp-tabs__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                      ) : null}
                      <span className="cp-tabs__label">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div aria-labelledby={activeTab} className="cp-chart" id={panelId} role="tabpanel">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={graph}
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    {graph === "bar" && <ThroughputBarChart run={inView} />}
                    {graph === "line" && <ThroughputLineChart />}
                    {graph === "pie" && <ProjectStatusChart />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <aside className="cp-card cp-quality" aria-label="Quality indicators">
              <div className="cp-card__head"><strong>Quality indicators</strong></div>
              <dl>
                {quality.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="cp-foot">
                <span>Review queue</span>
                <b>34 tasks pending</b>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartHeading({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="cp-card__head">
      <strong>{title}</strong>
      <span>{badge}</span>
    </div>
  );
}

function ThroughputBarChart({ run = true }: { run?: boolean }) {
  return (
    <div>
      <ChartHeading title="Weekly throughput" badge="99.4% SLA adherence" />
      <div className="cp-bars" aria-label="Weekly throughput bar chart">
        {throughput.map((height, index) => (
          <div className="cp-bars__col" key={days[index]}>
            <span className="cp-bars__track">
              <motion.i
                data-peak={index === 3}
                initial={{ height: "0%" }}
                animate={{ height: run ? `${height}%` : "0%" }}
                transition={{ duration: 0.9, delay: index * 0.07, ease: EASE }}
              />
            </span>
            <small>{days[index]}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThroughputLineChart() {
  const points = throughput.map((value, index) => ({
    x: 6 + (index / (throughput.length - 1)) * 88,
    y: 88 - (value / 100) * 70,
  }));
  const path = points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaPath = `${path} L 94 94 L 6 94 Z`;

  return (
    <div>
      <ChartHeading title="Weekly throughput" badge="Last 7 days" />
      <div className="cp-line" aria-label="Weekly throughput line chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="cp-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7be8c9" stopOpacity="0.45" />
              <stop offset="1" stopColor="#7be8c9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={areaPath} fill="url(#cp-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} />
          <motion.path
            d={path}
            className="cp-line__path"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
          />
          {points.map(({ x, y }, index) => (
            <motion.circle
              key={days[index]}
              cx={x}
              cy={y}
              r="1.6"
              className="cp-line__dot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.08, duration: 0.3 }}
            />
          ))}
        </svg>
        <div className="cp-days" aria-hidden="true">
          {days.map((day) => <small key={day}>{day}</small>)}
        </div>
      </div>
    </div>
  );
}

export function ProjectStatusChart() {
  const segments = [
    { label: "Completed", value: 42, color: "#7be8c9" },
    { label: "Active", value: 31, color: "#16a594" },
    { label: "Review", value: 18, color: "#e7d3a8" },
    { label: "Blocked", value: 9, color: "#476a64" },
  ];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div>
      <ChartHeading title="Project status" badge="100 projects" />
      <div className="cp-pie">
        <div className="cp-pie__ring" aria-label="Project status pie chart">
          <svg viewBox="0 0 110 110" aria-hidden="true">
            <circle cx="55" cy="55" r={radius} className="cp-pie__track" />
            {segments.map((segment, index) => {
              const length = (segment.value / 100) * circumference - 1.5;
              const currentOffset = offset;
              offset += (segment.value / 100) * circumference;
              return (
                <motion.circle
                  cx="55"
                  cy="55"
                  key={segment.label}
                  r={radius}
                  stroke={segment.color}
                  strokeDashoffset={-currentOffset}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${length} ${circumference - length}` }}
                  transition={{ duration: 0.8, delay: index * 0.12, ease: EASE }}
                  className="cp-pie__seg"
                />
              );
            })}
            <text x="55" y="53" textAnchor="middle" className="cp-pie__num">100</text>
            <text x="55" y="66" textAnchor="middle" className="cp-pie__label">Projects</text>
          </svg>
        </div>
        <div className="cp-pie__legend">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.08, duration: 0.4, ease: EASE }}
            >
              <span style={{ background: segment.color }} aria-hidden="true" />
              <span>{segment.label}</span>
              <b>{segment.value}</b>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tilts the product shot from a 3D lean to flat as it scrolls into view. */
export function CockpitStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const rotateX = useTransform(progress, [0, 1], [24, 0]);
  const scale = useTransform(progress, [0, 1], [0.9, 1]);
  const y = useTransform(progress, [0, 1], [40, 0]);
  const glow = useTransform(progress, [0, 1], [0.2, 0.75]);

  return (
    <div ref={ref} className="cp-stage">
      <motion.div className="cp-stage__glow" style={reduced ? undefined : { opacity: glow }} aria-hidden="true" />
      <motion.div className="cp-stage__frame" style={reduced ? undefined : { rotateX, scale, y }}>
        {children}
      </motion.div>
    </div>
  );
}
