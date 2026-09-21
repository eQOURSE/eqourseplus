"use client";

import { useState, useEffect } from "react";
import styles from "./home-redesign.module.css";

interface MetricData {
  label: string;
  value: number;
  delta: number;
  unit?: string;
}

interface QualityMetric {
  label: string;
  value: number;
  status: "operational" | "warning" | "critical";
}

interface ChartPoint {
  day: string;
  value: number;
}

export function LiveCockpit() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "specialists" | "quality">("overview");
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { day: "Mon", value: 42 },
    { day: "Tue", value: 66 },
    { day: "Wed", value: 82 },
    { day: "Thu", value: 94 },
    { day: "Fri", value: 78 },
    { day: "Sat", value: 48 },
    { day: "Sun", value: 56 },
  ]);
  const [metrics, setMetrics] = useState<MetricData[]>([
    { label: "Active Specialists", value: 47, delta: 12.4 },
    { label: "Active Vendor Teams", value: 8, delta: 4.1 },
    { label: "First Pass Yield", value: 96.8, delta: 2.7 },
    { label: "Deliverables YTD", value: 12400, delta: 18.2, unit: "" },
  ]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([
    { label: "Golden Match", value: 99.2, status: "operational" },
    { label: "Avg. Confidence", value: 97.4, status: "operational" },
    { label: "Escalation Rate", value: 1.8, status: "operational" },
    { label: "SLA Compliance", value: 100, status: "operational" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newPoints = prev.map((point, index) => {
          if (index === 6) {
            const variation = Math.random() * 15 - 7.5;
            return { ...point, value: Math.max(10, Math.min(100, point.value + variation)) };
          }
          return point;
        });
        return newPoints;
      });

      setMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          value: Math.max(0, metric.value + (Math.random() * 2 - 1)),
          delta: metric.delta + (Math.random() * 0.5 - 0.25),
        }))
      );

      setQualityMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          value: Math.max(0, Math.min(100, metric.value + (Math.random() * 0.3 - 0.15))),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatValue = (value: number, unit?: string) => {
    if (unit === "percent") {
      return value.toFixed(1) + "%";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + "K";
    }
    return Math.round(value).toString();
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return "text-[#059669]";
    if (delta < 0) return "text-[#dc2626]";
    return "text-[#6b7280]";
  };

  const getStatusColor = (status: QualityMetric["status"]) => {
    switch (status) {
      case "operational":
        return "text-[#059669]";
      case "warning":
        return "text-[#f59e0b]";
      case "critical":
        return "text-[#dc2626]";
      default:
        return "text-[#6b7280]";
    }
  };

  return (
    <div className={`cockpit ${styles.cockpit} eq-glass-stage`} aria-label="Live cockpit interface">
      <div aria-hidden="true" className="eq-glass-substrate" />
      
      {/* Browser Bar */}
      <div className={`${styles.browserBar} eq-glass-surface eq-glass-tier-regular`}>
        <div className={styles.windowDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <code>app.eqourse.plus/live-cockpit/project-orion</code>
        <div className={styles.cockpitTools}>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentTime.getSeconds() % 2 === 0 ? "bg-[#059669]" : "bg-[#6b7280]"} animate-pulse`} aria-label="Live status" />
            LIVE
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
          <span className="opacity-80">Dr. Aris V.</span>
        </div>
      </div>

      {/* Cockpit Header */}
      <div className={`${styles.cockpitHeader} eq-frosted eq-frosted--card`}>
        <div>
          <strong>Live Cockpit</strong>
          <div>
            <small>Project: RLHF — Financial Reasoning Set</small>
          </div>
        </div>
        <div className={styles.liveActions}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" aria-hidden="true" />
            LIVE WORKSPACE
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
              onClick={() => setActiveTab(tab.id as any)}
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
        {metrics.map((metric, index) => (
          <div key={index} className="group hover:bg-[hsl(var(--card)/0.3)] transition-colors duration-200 rounded-lg p-3">
            <small className="text-[hsl(var(--muted-foreground))]">{metric.label}</small>
            <div className="mt-2 flex items-baseline justify-between">
              <strong data-value={formatValue(metric.value, metric.unit)}>
                {formatValue(metric.value, metric.unit)}
              </strong>
              <em className={`${getDeltaColor(metric.delta)} flex items-center gap-1 text-xs font-medium transition-transform duration-300 group-hover:translate-x-1`}>
                {metric.delta > 0 ? "↑" : metric.delta < 0 ? "↓" : "•"} {Math.abs(metric.delta).toFixed(1)}%
              </em>
            </div>
          </div>
        ))}
      </div>

      {/* Telemetry Grid */}
      <div className={`${styles.telemetryGrid} eq-glass-surface eq-glass-tier-regular`}>
        {/* Chart Card */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeading}>
            <strong>Specialist Throughput — Last 7 Days</strong>
            <span className="flex items-center gap-1">
              <span className="text-[#059669]">↑</span> <i data-value="18.2%" /> 18.2% vs prior
            </span>
          </div>
          <div className={styles.chart} aria-label="Specialist throughput chart">
            {chartData.map((point, index) => (
              <div
                key={index}
                className="relative flex-1 group cursor-pointer"
                style={{ height: `${point.value}%` }}
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
                  aria-label={`${point.day}: ${Math.round(point.value)} throughput`}
                  title={`${point.day}: ${Math.round(point.value)} specialist actions`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    {point.day}: {Math.round(point.value)} actions
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
            {qualityMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-[hsl(var(--border)/0.6)] hover:bg-[hsl(var(--card)/0.3)] transition-colors rounded px-2 cursor-pointer group"
              >
                <dt className="text-[11px] text-[hsl(var(--muted-foreground))]">{metric.label}</dt>
                <dd
                  className={`${getStatusColor(metric.status)} font-bold text-[11px] transition-all duration-300 group-hover:scale-105`}
                  data-value={`${metric.value}%`}
                >
                  {metric.value.toFixed(1)}%
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 pt-3 border-t border-[hsl(var(--border)/0.7)]">
            <p className={`${styles.cockpitFoot} flex items-center gap-2`}>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                All systems
              </span>
              <b className="text-[#059669]">Operational</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
