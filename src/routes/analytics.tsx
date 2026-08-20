import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import { LoadChart } from "@/components/sage/LoadChart";
import { Kpi, Panel, PageHeader } from "@/components/sage/ui";
import { formatMoney, formatNumber } from "@/lib/sage/analytics";
import { getYearlyEnergyData, type DailyEnergyRecord } from "@/lib/sage/backend";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Energy Analytics — SAGE" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly campus consumption, peak vs idle load, waste share and cost breakdown.",
      },
      { property: "og:title", content: "Energy Analytics — SAGE" },
      {
        property: "og:description",
        content: "Deep-dive analytics on campus consumption, peaks, idle load and cost.",
      },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { state, metrics, settings } = useSage();
  const [yearlyRecords, setYearlyRecords] = useState<DailyEnergyRecord[]>([]);

  useEffect(() => {
    void getYearlyEnergyData().then(setYearlyRecords).catch(() => setYearlyRecords([]));
  }, []);

  const weekly = useMemo(() => {
    if (yearlyRecords.length >= 7) {
      return yearlyRecords.slice(-7).map((record) => ({
        day: new Date(`${record.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
        kwh: record.kwh,
      }));
    }
    return ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => ({
      day,
      kwh: Number((metrics.dailyKwh * [0.62, 0.95, 1.05, 1.02, 1.08, 0.98, 0.4][i]!).toFixed(0)),
    }));
  }, [metrics.dailyKwh, yearlyRecords]);

  const split = [
    { name: "Lighting", value: Math.round(metrics.kw * 0.32 * 100) / 100 },
    { name: "Fans", value: Math.round(metrics.kw * 0.27 * 100) / 100 },
    { name: "Air conditioning", value: Math.round(metrics.kw * 0.33 * 100) / 100 },
    { name: "Projectors & misc", value: Math.round(metrics.kw * 0.08 * 100) / 100 },
  ];
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-5)",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Energy Analytics"
        subtitle="Processed sensor telemetry turned into consumption, peak, idle and cost intelligence."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Today" value={formatNumber(metrics.dailyKwh, 0)} unit="kWh" tone="energy" />
        <Kpi label="This week" value={formatNumber(metrics.weeklyKwh, 0)} unit="kWh" />
        <Kpi label="This month" value={formatNumber(metrics.monthlyKwh, 0)} unit="kWh" />
        <Kpi
          label="Monthly cost"
          value={formatMoney(metrics.monthlyCost, settings)}
          hint={`At ${settings.tariff} ${settings.currency}/kWh`}
        />
      </div>

      <Panel title="Live load trend" description="Total vs wasted kilowatts">
        <LoadChart data={state.history} height={280} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Weekly consumption"
          description={yearlyRecords.length ? "Last 7 days from the local backend's 365-day telemetry" : "Start the local backend to load saved telemetry"}
        >
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} width={60} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="kwh" name="kWh" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Load composition" description="Estimated split of current campus draw">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={split} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {split.map((_, i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Peak load today" value={formatNumber(metrics.peakKw, 2)} unit="kW" tone="info" />
        <Kpi label="Idle consumption" value={formatNumber(metrics.idleKw, 2)} unit="kW" tone="waste" />
        <Kpi label="Waste share" value={formatNumber(metrics.wastePct, 1)} unit="%" tone="waste" />
        <Kpi label="Efficiency score" value={String(metrics.efficiency)} unit="/100" tone="energy" />
      </div>
    </div>
  );
}
