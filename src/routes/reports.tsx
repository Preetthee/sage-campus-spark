import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";

import { Panel, PageHeader, Pill, downloadCsv } from "@/components/sage/ui";
import { buildPredictions, buildRecommendations, formatMoney, formatNumber } from "@/lib/sage/analytics";
import { askGuardian, buildContext } from "@/lib/sage/guardian";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Energy Reports — SAGE" },
      {
        name: "description",
        content:
          "Generate daily, weekly and monthly campus energy reports with executive summary, building comparison, alerts and AI recommendations.",
      },
      { property: "og:title", content: "Energy Reports — SAGE" },
      {
        property: "og:description",
        content: "Exportable daily, weekly and monthly campus energy reports.",
      },
    ],
  }),
  component: Reports,
});

type Period = "daily" | "weekly" | "monthly";

function Reports() {
  const { state, metrics, settings } = useSage();
  const [period, setPeriod] = useState<Period>("daily");

  const ctx = useMemo(() => buildContext(state, metrics, settings), [state, metrics, settings]);
  const summary = askGuardian("summarize today's campus performance", ctx, metrics, settings);
  const recs = buildRecommendations(metrics, settings);
  const predictions = buildPredictions(metrics, settings);

  const kwh =
    period === "daily" ? metrics.dailyKwh : period === "weekly" ? metrics.weeklyKwh : metrics.monthlyKwh;
  const cost = kwh * settings.tariff;
  const worst = [...metrics.rooms].sort((a, b) => b.wasteKw - a.wasteKw).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Board-ready energy reports assembled from live analytics, alerts and AI recommendations."
        actions={
          <div className="no-print flex items-center gap-2">
            <div className="flex gap-1 rounded-md border border-border p-1">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={
                    period === p
                      ? "rounded bg-primary/15 px-2.5 py-1 text-[11px] font-medium capitalize text-primary"
                      : "rounded px-2.5 py-1 text-[11px] capitalize text-muted-foreground hover:bg-accent/10"
                  }
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `sage-${period}-report.csv`,
                  metrics.buildings.map((b) => ({
                    building: b.building.name,
                    liveKw: b.kw.toFixed(2),
                    wastePct: b.wastePct.toFixed(1),
                    dailyKwh: b.dailyKwh.toFixed(0),
                    dailyCost: b.dailyCost.toFixed(0),
                    efficiency: b.efficiency,
                  })),
                )
              }
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/10"
            >
              <Download className="size-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Printer className="size-3.5" /> Export PDF
            </button>
          </div>
        }
      />

      <Panel title={`${period[0]!.toUpperCase()}${period.slice(1)} energy report`} description={settings.campusName}>
        <section className="space-y-2 text-xs leading-relaxed">
          <h3 className="text-sm font-semibold text-foreground">Executive summary</h3>
          {summary.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="text-muted-foreground">
              {line.replace(/\*\*/g, "")}
            </p>
          ))}
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Campus overview</h3>
          <dl className="tabular mt-2 grid gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Consumption</dt>
              <dd className="text-primary">{formatNumber(kwh, 0)} kWh</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cost</dt>
              <dd>{formatMoney(cost, settings)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Waste share</dt>
              <dd className="text-waste">{formatNumber(metrics.wastePct, 1)}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Efficiency</dt>
              <dd>{metrics.efficiency}/100</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Building comparison</h3>
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">Building</th>
                <th className="py-2 font-medium">Live kW</th>
                <th className="py-2 font-medium">Waste %</th>
                <th className="py-2 font-medium">kWh today</th>
                <th className="py-2 font-medium">Cost today</th>
                <th className="py-2 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {metrics.buildings.map((b) => (
                <tr key={b.building.id} className="tabular border-b border-border/60">
                  <td className="py-2 font-sans text-foreground">{b.building.name}</td>
                  <td className="py-2">{formatNumber(b.kw, 2)}</td>
                  <td className="py-2 text-waste">{formatNumber(b.wastePct, 1)}</td>
                  <td className="py-2">{formatNumber(b.dailyKwh, 0)}</td>
                  <td className="py-2">{formatMoney(b.dailyCost, settings)}</td>
                  <td className="py-2">{b.efficiency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Room analysis · highest waste</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {worst.map((r) => (
              <li key={r.room.id}>
                {r.room.code} ({r.building.name}) — {formatNumber(r.kw, 2)} kW live,{" "}
                {formatNumber(r.wasteKw, 2)} kW avoidable, {r.room.occupancy} occupants.
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Alerts in period</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {state.alerts.slice(0, 8).map((a) => (
              <li key={a.id}>
                [{a.severity}] {a.title}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Forecast</h3>
          <ul className="tabular mt-2 space-y-1 text-xs text-muted-foreground">
            {predictions.map((p) => (
              <li key={p.horizon}>
                {p.horizon}: {formatNumber(p.kwh, 0)} kWh · {formatMoney(p.cost, settings)} · confidence{" "}
                {p.confidence}%
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">AI recommendations</h3>
          <ol className="mt-2 space-y-2 text-xs text-muted-foreground">
            {recs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <Pill tone={r.priority === "high" ? "critical" : r.priority === "medium" ? "waste" : "muted"}>
                  {r.priority}
                </Pill>
                <span className="text-foreground">{r.title}</span>
                <span>— {formatMoney(r.savingsPerYear, settings)}/yr</span>
              </li>
            ))}
          </ol>
        </section>
      </Panel>
    </div>
  );
}