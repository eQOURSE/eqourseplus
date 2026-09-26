"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type KeyboardEvent, useId, useState } from "react";

import styles from "./home-redesign.module.css";

const metrics = [
  { label: "Active Specialists", value: "88", change: "Interface", trend: "up" },
  { label: "Active Vendor Teams", value: "50", change: "Interface", trend: "up" },
  { label: "First Pass Yield", value: "80%", change: "Interface", trend: "up" },
  { label: "Deliverables YTD", value: "90%", change: "Interface", trend: "up" },
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

export function CockpitPreview() {
  const [graph, setGraph] = useState<Graph>("bar");
  const tabsId = useId();
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
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    tabs?.[nextIndex]?.focus();
  }

  return (
    <section
      className={`cockpit ${styles.cockpit} eq-glass-stage`}
      aria-label="Live cockpit interface preview"
      data-liquid-glass-root
    >
      <div aria-hidden="true" className="eq-glass-substrate" />

      <div className={`${styles.browserBar} eq-glass-surface eq-glass-tier-regular`}>
        <div className={styles.windowDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <code>plus.eqourse.com/cockpit/telemetry-live</code>
        <span className={styles.cockpitTools}>Workspace preview</span>
      </div>

      <div className={`${styles.cockpitHeader} eq-frosted eq-frosted--card`}>
        <div>
          <div className={styles.cockpitTitleRow}>
            <strong>Live Cockpit</strong>
            <span className={styles.streamingBadge}>● Preview</span>
          </div>
          <small>Illustrative pipeline calibration &amp; specialist telemetry interface</small>
        </div>
        <div className={styles.liveActions}>
          <button type="button" className="eq-glass-button eq-glass-button--secondary">
            Export run manifest
          </button>
          <span className={styles.dateRange}>Last 30 days</span>
        </div>
      </div>

      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <small>{metric.label}</small>
            <p>
              <strong>{metric.value}</strong>
              <em data-trend={metric.trend}>{metric.change}</em>
            </p>
          </div>
        ))}
      </div>

      <div className={styles.telemetryGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartCardTopline}>
            <strong>Throughput trend &amp; SLA calibrations</strong>
            <div className={styles.graphSwitcher} role="tablist" aria-label="Chart type">
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
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div
            aria-labelledby={activeTab}
            className={styles.chartContent}
            id={panelId}
            role="tabpanel"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={graph}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
              >
                {graph === "bar" && <ThroughputBarChart />}
                {graph === "line" && <ThroughputLineChart />}
                {graph === "pie" && <ProjectStatusChart />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <aside className={styles.qualityCard} aria-label="Quality indicators">
          <div className={styles.cardHeading}>
            <strong>Quality indicators</strong>
          </div>
          <dl>
            {quality.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.cockpitFoot}>
            <span>Review queue</span>
            <b>34 tasks pending</b>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ChartHeading({ title, badge }: { title: string; badge: string }) {
  return (
    <div className={styles.cardHeading}>
      <strong>{title}</strong>
      <span>{badge}</span>
    </div>
  );
}

function ThroughputBarChart() {
  return (
    <div className={styles.chartView}>
      <ChartHeading title="Weekly throughput" badge="99.4% SLA adherence" />
      <div className={styles.barChart} aria-label="Weekly throughput bar chart">
        {throughput.map((height, index) => (
          <div className={styles.barColumn} key={days[index]}>
            <span className={styles.barTrack}>
              <motion.i
                initial={{ height: "0%" }}
                animate={{ height: `${height}%` }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.07,
                  ease: [0.25, 0.1, 0.25, 1.0],
                }}
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
  const path = points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const areaPath = `${path} L 94 94 L 6 94 Z`;

  return (
    <div className={styles.chartView}>
      <ChartHeading title="Weekly throughput" badge="Last 7 days" />
      <div className={styles.lineChart} aria-label="Weekly throughput line chart">
        <svg className={styles.lineChartSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            className={styles.lineChartArea}
            d={areaPath}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.path
            className={styles.lineChartPath}
            d={path}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          />
          {points.map(({ x, y }, index) => (
            <motion.circle
              key={days[index]}
              cx={x}
              cy={y}
              r="1.8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
            />
          ))}
        </svg>
        <div className={styles.chartDays} aria-hidden="true">
          {days.map((day) => <small key={day}>{day}</small>)}
        </div>
      </div>
    </div>
  );
}

export function ProjectStatusChart() {
  const segments = [
    { label: "Completed", value: 42, className: styles.pieCompleted },
    { label: "Active", value: 31, className: styles.pieActive },
    { label: "Review", value: 18, className: styles.pieReview },
    { label: "Blocked", value: 9, className: styles.pieBlocked },
  ];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={styles.chartView}>
      <ChartHeading title="Project status" badge="100 projects" />
      <div className={styles.pieLayout}>
        <div className={styles.pieWrapper} aria-label="Project status pie chart">
          <svg viewBox="0 0 110 110" aria-hidden="true">
            <circle className={styles.pieTrack} cx="55" cy="55" r={radius} />
            {segments.map((segment, index) => {
              const length = (segment.value / 100) * circumference;
              const currentOffset = offset;
              offset += length;
              return (
                <motion.circle
                  className={segment.className}
                  cx="55"
                  cy="55"
                  key={segment.label}
                  r={radius}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  }}
                />
              );
            })}
            <motion.text
              x="55"
              y="52"
              textAnchor="middle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              100
            </motion.text>
            <motion.text
              className={styles.pieCenterLabel}
              x="55"
              y="65"
              textAnchor="middle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Projects
            </motion.text>
          </svg>
        </div>
        <div className={styles.pieLegend}>
          {segments.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
            >
              <span className={segment.className} aria-hidden="true" />
              <span>{segment.label}</span>
              <b>{segment.value}</b>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
