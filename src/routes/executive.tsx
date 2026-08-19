import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Leaf, PiggyBank, ShieldCheck, Wallet } from "lucide-react";

import { Kpi, Meter, Panel, PageHeader, Pill } from "@/components/sage/ui";
import { formatMoney, formatNumber } from "@/lib/sage/analytics";
import { askGuardian, buildContext } from "@/lib/sage/guardian";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/executive")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — SAGE" },
      {
        name: "description",
        content:
          "Management view of campus energy: cost analysis, building comparison, sustainability score and annual savings projection.",
      },
      { property: "og:title", content: "Executive Dashboard — SAGE" },
      {
        property: "og:description",
        content: "Campus KPIs, cost analysis and sustainability metrics for university management.",
      },
    ],
  }),
  component: Executive,
});

function Executive() {
  const { state, metrics, settings } = useSage();
  const ctx = useMemo(() => buildContext(state, metrics, settings), [state, metrics, settings]);
  const summary = askGuardian("how can we reduce the electricity bill", ctx, metrics, settings);

  const costData = metrics.buildings.map((b) => ({
    name: b.building.code,
    cost: Number((b.dailyCost * 26).toFixed(0)),
    avoidable: Number((b.dailyCost * 26 * (b.wastePct / 100)).toFixed(0)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`Financial and sustainability view of energy performance at ${settings.campusName}.`}
        actions={<Pill tone="energy">Sustainability {metrics.sustainabilityScore}/100</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Annual energy cost"
          value={formatMoney(metrics.annualCost, settings)}
          tone="info"
          icon={<Wallet className="size-4" />}
          hint={`${formatNumber(metrics.monthlyKwh * 12, 0)} kWh/year`}
        />
        <Kpi
          label="Annual savings potential"
          value={formatMoney(metrics.annualSavings, settings)}
          tone="energy"
          icon={<PiggyBank className="size-4" />}
          hint="From eliminating detected waste"
        />
        <Kpi
          label="CO₂ footprint"
          value={formatNumber(metrics.co2Annual / 1000, 1)}
          unit="t/yr"
          tone="waste"
          icon={<Leaf className="size-4" />}
          hint={`${formatNumber(metrics.co2Avoidable / 1000, 1)} t avoidable`}
        />
        <Kpi
          label="Campus efficiency"
          value={String(metrics.efficiency)}
          unit="/100"
          icon={<ShieldCheck className="size-4" />}
          hint={`Waste at ${formatNumber(metrics.wastePct, 1)}%`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Monthly cost by building" description="Total spend vs avoidable spend">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} width={70} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cost" name="Monthly cost" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avoidable" name="Avoidable" fill="var(--color-waste)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="AI executive summary" description="Generated from live campus telemetry">
          <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            {summary.split("\n").filter(Boolean).map((line, i) => (
              <p key={i}>{line.replace(/\*\*/g, "")}</p>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Building scorecard" description="Efficiency ranking with cost exposure">
        <div className="space-y-4">
          {[...metrics.buildings]
            .sort((a, b) => b.efficiency - a.efficiency)
            .map((b) => (
              <div key={b.building.id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{b.building.name}</span>
                    <span className="tabular text-muted-foreground">
                      {formatMoney(b.dailyCost * 312, settings)}/yr
                    </span>
                  </div>
                  <div className="mt-2">
                    <Meter value={b.efficiency} />
                  </div>
                </div>
                <Pill tone={b.efficiency > 80 ? "energy" : b.efficiency > 60 ? "waste" : "critical"}>
                  {b.efficiency}/100
                </Pill>
              </div>
            ))}
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Rooms monitored" value={String(metrics.totalRooms)} />
        <Kpi label="Devices online" value={`${metrics.devicesOnline}/${metrics.devicesTotal}`} tone="energy" />
        <Kpi label="People on campus" value={String(metrics.occupancy)} tone="info" />
      </div>
    </div>
  );
}
