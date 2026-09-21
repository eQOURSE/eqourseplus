"use client";

import { useState } from "react";
import styles from "./home-redesign.module.css";

interface QualityMetric {
  label: string;
  status: "configured";
}

interface ChartPoint {
  day: string;
  height: number;
}

type CockpitTab = "overview" | "specialists" | "quality";

export function LiveCockpit() {
  const [activeTab, setActiveTab] = useState<CockpitTab>("overview");
  const chartData: ChartPoint[] = [
    { day: "Mon", height: 42 }, { day: "Tue", height: 66 },
    { day: "Wed", height: 82 }, { day: "Thu", height: 94 },
    { day: "Fri", height: 78 }, { day: "Sat", height: 48 },
    { day: "Sun", height: 56 },
  ];
  const metrics = ["Active Specialists", "Active Vendor Teams", "First Pass Yield", "Deliverables YTD"];
  const qualityMetrics: QualityMetric[] = [
    { label: "Golden Match", status: "configured" },
    { label: "Avg. Confidence", status: "configured" },
    { label: "Escalation Rate", status: "configured" },
    { label: "SLA Compliance", status: "configured" },
  ];

  return (
    <div className={`cockpit ${styles.cockpit} eq-glass-stage`} aria-label="Workspace interface preview">
      <div aria-hidden="true" className="eq-glass-substrate" />
      
      {/* Browser Bar */}
      <div className={`${styles.browserBar} eq-glass-surface eq-glass-tier-regular`}>
        <div className={styles.windowDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <code>plus.eqourse.com/live-cockpit/project-orion</code>
        <div className={styles.cockpitTools}>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6b7280]" aria-hidden="true" />
            PREVIEW
          </span>
          <span className="mx-2">•</span>
          <span className="flex items-center gap-1">
            ⌕ <span className="text-[10px] opacity-70">Search</span>
          </span>
          <span className="mx-2">•</span>
          <span className="flex items-center gap-1">
            ⌘K <span className="text-[10px] opacity-70">Command</span>
          </span>
          <span className="mx-2">•</span>
          <span className="opacity-80">Workspace preview</span>
        </div>
      </div>

      {/* Cockpit Header */}
      <div className={`${styles.cockpitHeader} eq-frosted eq-frosted--card`}>
        <div>
          <strong>Client dashboard preview</strong>
          <div>
            <small>Interface example — not live data</small>
          </div>
        </div>
        <div className={styles.liveActions}>
            <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6b7280]" aria-hidden="true" />
            PREVIEW
          </span>
          <button type="button" className="eq-glass-button eq-glass-button--secondary eq-glass-surface eq-glass-tier-regular">
            View workspace
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-[hsl(var(--border)/0.7)] pb-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "specialists", label: "Specialists" },
            { id: "quality", label: "Quality" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CockpitTab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.22)]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={`${styles.metrics} eq-frosted eq-frosted--card`}>
        {metrics.map((metric) => (
          <div key={metric} className="group hover:bg-[hsl(var(--card)/0.3)] transition-colors duration-200 rounded-lg p-3">
            <small className="text-[hsl(var(--muted-foreground))]">{metric}</small>
            <div className="mt-2 flex items-baseline justify-between">
              <strong>Preview</strong>
              <em className="text-[hsl(var(--muted-foreground))]">Interface</em>
            </div>
          </div>
        ))}
      </div>

      {/* Telemetry Grid */}
      <div className={`${styles.telemetryGrid} eq-glass-surface eq-glass-tier-regular`}>
        {/* Chart Card */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeading}>
            <strong>Illustrative throughput layout</strong>
            <span>Interface preview</span>
          </div>
          <div className={styles.chart} aria-label="Specialist throughput chart">
            {chartData.map((point, index) => (
              <div
                key={index}
                className="relative flex-1 group cursor-pointer"
                style={{ height: `${point.height}%` }}
              >
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    index === 6
                      ? "bg-gradient-to-t from-[hsl(170_82%_65%)] to-[hsl(var(--primary))]"
                      : "bg-[hsl(var(--border)/0.6)]"
                  } hover:brightness-110`}
                  style={{ borderRadius: "4px 4px 0 0" }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${point.day}: illustrative bar`}
                  title="Illustrative interface element"
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    Illustrative preview
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-2">
            {chartData.map((point, index) => (
              <span key={index} className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {point.day}
              </span>
            ))}
          </div>
        </div>

        {/* Quality Card */}
        <div className={styles.qualityCard}>
          <strong className="block mb-4 text-xs uppercase tracking-widest text-[hsl(var(--primary))]">QUALITY INDICATORS</strong>
          <dl className="space-y-3">
            {qualityMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex justify-between items-center py-2 border-b border-[hsl(var(--border)/0.6)] hover:bg-[hsl(var(--card)/0.3)] transition-colors rounded px-2 cursor-pointer group"
              >
                <dt className="text-[11px] text-[hsl(var(--muted-foreground))]">{metric.label}</dt>
                <dd
                  className="text-[hsl(var(--muted-foreground))] font-bold text-[11px] transition-all duration-300 group-hover:scale-105"
                >
                  Preview
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 pt-3 border-t border-[hsl(var(--border)/0.7)]">
            <p className={`${styles.cockpitFoot} flex items-center gap-2`}>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                Interface
              </span>
              <b className="text-[hsl(var(--muted-foreground))]">Preview only</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
