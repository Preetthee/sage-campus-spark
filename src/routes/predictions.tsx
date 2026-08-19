import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Meter, Panel, PageHeader, Pill } from "@/components/sage/ui";
import { buildPredictions, formatMoney, formatNumber } from "@/lib/sage/analytics";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Predictive Analytics — SAGE" },
      {
        name: "description",
        content:
          "Forecast campus energy for the next hour, tomorrow, the next week, month and year with confidence scores and savings potential.",
      },
      { property: "og:title", content: "Predictive Analytics — SAGE" },
      {
        property: "og:description",
        content: "Energy forecasting with confidence scores and expected savings.",
      },
    ],
  }),
  component: Predictions,
});

function Predictions() {
  const { metrics, settings } = useSage();
  const predictions = buildPredictions(metrics, settings);

  const curve = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const shape = [0.5, 0.72, 0.92, 1, 0.86, 0.63, 0.78, 0.95, 0.9, 0.7, 0.45, 0.28][i]!;
    const kw = metrics.kw * shape;
    return {
      label: `${hour}:00`,
      forecast: Number(kw.toFixed(2)),
      upper: Number((kw * 1.12).toFixed(2)),
      lower: Number((kw * 0.88).toFixed(2)),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictions"
        subtitle="Forecasts derived from the live consumption curve, occupancy patterns and timetable density."
      />

      <Panel title="Next 12 hours" description="Forecast with an 88–112% confidence band">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                unit=" kW"
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                name="Upper bound"
                stroke="none"
                fill="var(--color-primary)"
                fillOpacity={0.12}
              />
              <Area
                type="monotone"
                dataKey="lower"
                name="Lower bound"
                stroke="none"
                fill="var(--color-background)"
                fillOpacity={0.9}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {predictions.map((p) => (
          <article key={p.horizon} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{p.horizon}</h2>
              <Pill tone={p.trend >= 0 ? "waste" : "energy"}>
                {p.trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {formatNumber(Math.abs(p.trend), 1)}%
              </Pill>
            </div>
            <p className="tabular mt-3 text-2xl font-semibold text-primary">
              {formatNumber(p.kwh, 0)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">kWh</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cost {formatMoney(p.cost, settings)} · avoidable {formatMoney(p.savings, settings)}
            </p>
            <div className="mt-3">
              <Meter value={p.confidence} />
              <p className="mt-1 text-[11px] text-muted-foreground">Confidence {p.confidence}%</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}