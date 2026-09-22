"use client";

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
            {graph === "bar" && <ThroughputBarChart />}
            {graph === "line" && <ThroughputLineChart />}
            {graph === "pie" && <ProjectStatusChart />}
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
              <i style={{ height: `${height}%` }} />
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
          <path className={styles.lineChartArea} d={areaPath} />
          <path className={styles.lineChartPath} d={path} />
          {points.map(({ x, y }, index) => (
            <circle key={days[index]} cx={x} cy={y} r="1.8" />
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
            {segments.map((segment) => {
              const length = (segment.value / 100) * circumference;
              const currentOffset = offset;
              offset += length;
              return (
                <circle
                  className={segment.className}
                  cx="55"
                  cy="55"
                  key={segment.label}
                  r={radius}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                />
              );
            })}
            <text x="55" y="52" textAnchor="middle">100</text>
            <text className={styles.pieCenterLabel} x="55" y="65" textAnchor="middle">Projects</text>
          </svg>
        </div>
        <div className={styles.pieLegend}>
          {segments.map((segment) => (
            <div key={segment.label}>
              <span className={segment.className} aria-hidden="true" />
              <span>{segment.label}</span>
              <b>{segment.value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
