import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AirVent, Fan, Lightbulb, MonitorPlay } from "lucide-react";

import { Kpi, Panel, PageHeader, Pill } from "@/components/sage/ui";
import { useSage } from "@/lib/sage/store";
import type { DeviceStatus, DeviceType } from "@/lib/sage/types";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Devices — SAGE Campus Energy" },
      {
        name: "description",
        content:
          "Campus device inventory with live wattage and health status: online, failing or offline lights, fans, ACs and projectors.",
      },
      { property: "og:title", content: "Devices — SAGE Campus Energy" },
      {
        property: "og:description",
        content: "Device health and live wattage across the campus IoT network.",
      },
    ],
  }),
  component: Devices,
});

const ICONS: Record<DeviceType, typeof Fan> = {
  light: Lightbulb,
  fan: Fan,
  ac: AirVent,
  projector: MonitorPlay,
};

export default function noop() {}

function Devices() {
  const { state } = useSage();
  const [status, setStatus] = useState<DeviceStatus | "all">("all");

  const roomCode = useMemo(
    () => new Map(state.rooms.map((r) => [r.id, r.code])),
    [state.rooms],
  );

  const counts = {
    online: state.devices.filter((d) => d.status === "online").length,
    failing: state.devices.filter((d) => d.status === "failing").length,
    offline: state.devices.filter((d) => d.status === "offline").length,
  };

  const rows = state.devices
    .filter((d) => status === "all" || d.status === status)
    .sort((a, b) => b.watts - a.watts)
    .slice(0, 120);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devices"
        subtitle="Every monitored light, fan, air conditioner and projector, with live draw and health."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Devices monitored" value={String(state.devices.length)} />
        <Kpi label="Online" value={String(counts.online)} tone="energy" />
        <Kpi label="Failing" value={String(counts.failing)} tone="waste" />
        <Kpi label="Offline" value={String(counts.offline)} tone="critical" />
      </div>

      <Panel
        title="Device inventory"
        description="Sorted by live wattage · top 120"
        actions={
          <div className="flex gap-1">
            {(["all", "online", "failing", "offline"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={
                  status === s
                    ? "rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-medium capitalize text-primary"
                    : "rounded-md px-2.5 py-1 text-[11px] capitalize text-muted-foreground hover:bg-accent/10"
                }
              >
                {s}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => {
            const Icon = ICONS[d.type];
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{d.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {roomCode.get(d.roomId)} · rated {d.ratedWatts} W
                  </p>
                </div>
                <span className="tabular text-xs text-primary">{d.watts} W</span>
                <Pill
                  tone={d.status === "online" ? "energy" : d.status === "failing" ? "waste" : "critical"}
                >
                  {d.status}
                </Pill>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}