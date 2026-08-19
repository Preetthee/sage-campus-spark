import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Kpi, Meter, Panel, PageHeader, Pill } from "@/components/sage/ui";
import { formatMoney, formatNumber } from "@/lib/sage/analytics";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/buildings")({
  head: () => ({
    meta: [
      { title: "Buildings — SAGE Campus Energy" },
      {
        name: "description",
        content:
          "Compare live load, efficiency, occupancy and daily cost across every campus building block.",
      },
      { property: "og:title", content: "Buildings — SAGE Campus Energy" },
      {
        property: "og:description",
        content: "Building-level energy comparison and efficiency scoring.",
      },
    ],
  }),
  component: Buildings,
});

function Buildings() {
  const { metrics, settings } = useSage();
  const chartData = metrics.buildings.map((b) => ({
    name: b.building.code,
    load: Number(b.kw.toFixed(2)),
    waste: Number(b.wasteKw.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildings"
        subtitle="Block-level energy performance, occupancy and cost across the pilot campus."
      />

      <Panel title="Live load by building" description="Total vs wasted kilowatts">
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
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
              <Bar dataKey="load" name="Total load" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="waste" name="Wasted" fill="var(--color-waste)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.buildings.map((b) => (
          <Panel
            key={b.building.id}
            title={b.building.name}
            description={`${b.rooms} monitored rooms · ${b.building.floors} floors`}
            actions={
              <Pill tone={b.efficiency > 80 ? "energy" : b.efficiency > 60 ? "waste" : "critical"}>
                Efficiency {b.efficiency}/100
              </Pill>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Kpi label="Live load" value={formatNumber(b.kw, 2)} unit="kW" tone="energy" />
              <Kpi label="Wasted" value={formatNumber(b.wasteKw, 2)} unit="kW" tone="waste" />
              <Kpi label="Occupancy" value={String(b.occupancy)} unit="people" tone="info" />
              <Kpi
                label="Cost today"
                value={formatMoney(b.dailyCost, settings)}
                hint={`${formatNumber(b.dailyKwh, 0)} kWh`}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Building2 className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <Meter value={b.wastePct} tone="waste" />
              </div>
              <span className="tabular text-xs text-waste">{formatNumber(b.wastePct, 1)}% waste</span>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}