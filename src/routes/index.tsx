import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, DoorOpen, Gauge, Leaf, Users, Zap } from "lucide-react";

import { LoadChart } from "@/components/sage/LoadChart";
import { Kpi, Meter, Panel, Pill, PageHeader } from "@/components/sage/ui";
import { formatMoney, formatNumber } from "@/lib/sage/analytics";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Energy Dashboard — SAGE" },
      {
        name: "description",
        content:
          "Live campus energy dashboard for Varendra University: real-time load, waste detection, occupancy and active alerts.",
      },
      { property: "og:title", content: "Campus Energy Dashboard — SAGE" },
      {
        property: "og:description",
        content: "Real-time classroom energy monitoring with AI-driven waste detection.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, metrics, settings } = useSage();
  const worst = [...metrics.rooms].sort((a, b) => b.wasteKw - a.wasteKw).slice(0, 6);
  const alerts = state.alerts.filter((a) => !a.acknowledged).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Energy Dashboard"
        subtitle={`Live intelligence across ${metrics.totalRooms} monitored classrooms in ${metrics.buildings.length} buildings at ${settings.campusName}.`}
        actions={<Pill tone="energy">Simulated IoT stream · tick {state.tick}</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Live campus load"
          value={formatNumber(metrics.kw, 2)}
          unit="kW"
          tone="energy"
          icon={<Zap className="size-4" />}
          hint={`Peak today ${formatNumber(metrics.peakKw, 2)} kW`}
        />
        <Kpi
          label="Avoidable waste"
          value={formatNumber(metrics.wastePct, 1)}
          unit="%"
          tone="waste"
          icon={<Activity className="size-4" />}
          hint={`${formatNumber(metrics.wasteKw, 2)} kW being wasted now`}
        />
        <Kpi
          label="Efficiency score"
          value={String(metrics.efficiency)}
          unit="/100"
          icon={<Gauge className="size-4" />}
          hint={`Sustainability ${metrics.sustainabilityScore}/100`}
        />
        <Kpi
          label="Projected cost today"
          value={formatMoney(metrics.dailyCost, settings)}
          icon={<Leaf className="size-4" />}
          hint={`${formatNumber(metrics.dailyKwh, 0)} kWh · ${formatNumber(metrics.co2Daily, 0)} kg CO₂`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Campus load vs wasted load"
          description="Rolling window of the live sensor stream"
        >
          <LoadChart data={state.history} />
        </Panel>

        <div className="space-y-4">
          <Panel title="Occupancy" description="Across all monitored rooms">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-info" />
              <p className="tabular text-2xl font-semibold">{metrics.occupancy}</p>
              <p className="text-xs text-muted-foreground">
                people in {metrics.activeRooms} of {metrics.totalRooms} rooms
              </p>
            </div>
            <div className="mt-4">
              <Meter value={(metrics.activeRooms / metrics.totalRooms) * 100} />
            </div>
          </Panel>

          <Panel
            title="Active alerts"
            description="Auto-detected by the rules engine"
            actions={
              <Link to="/alerts" className="text-xs text-primary hover:underline">
                View all
              </Link>
            }
          >
            <ul className="space-y-3">
              {alerts.length === 0 && (
                <li className="text-xs text-muted-foreground">No open alerts — campus is clean.</li>
              )}
              {alerts.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <AlertTriangle
                    className={
                      a.severity === "critical"
                        ? "mt-0.5 size-4 shrink-0 text-critical"
                        : a.severity === "warning"
                          ? "mt-0.5 size-4 shrink-0 text-waste"
                          : "mt-0.5 size-4 shrink-0 text-info"
                    }
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel
        title="Rooms with the highest avoidable load"
        description="Ranked by wasted kilowatts right now"
        actions={
          <Link to="/classrooms" className="text-xs text-primary hover:underline">
            All classrooms
          </Link>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {worst.map((r) => (
            <div key={r.room.id} className="rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <DoorOpen className="size-4 text-muted-foreground" />
                  {r.room.code}
                </p>
                {r.idle ? <Pill tone="critical">Empty · powered</Pill> : <Pill tone="muted">In use</Pill>}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.building.name}</p>
              <div className="tabular mt-3 flex items-center justify-between text-xs">
                <span className="text-primary">{formatNumber(r.kw, 2)} kW</span>
                <span className="text-waste">{formatNumber(r.wasteKw, 2)} kW wasted</span>
              </div>
              <div className="mt-2">
                <Meter value={r.wastePct} tone="waste" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}