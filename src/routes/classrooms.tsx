import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { Panel, PageHeader, Pill, downloadCsv } from "@/components/sage/ui";
import { formatNumber } from "@/lib/sage/analytics";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/classrooms")({
  head: () => ({
    meta: [
      { title: "Classrooms — SAGE Campus Energy" },
      {
        name: "description",
        content:
          "Room-by-room live telemetry: occupancy, lights, fans, temperature, live watts and waste flags.",
      },
      { property: "og:title", content: "Classrooms — SAGE Campus Energy" },
      {
        property: "og:description",
        content: "Per-classroom energy telemetry with automatic waste flags.",
      },
    ],
  }),
  component: Classrooms,
});

function Classrooms() {
  const { state, metrics } = useSage();
  const [query, setQuery] = useState("");
  const [onlyWaste, setOnlyWaste] = useState(false);

  const rows = useMemo(() => {
    return metrics.rooms
      .map((r) => {
        const devices = state.devices.filter((d) => d.roomId === r.room.id);
        return {
          ...r,
          lightsOn: devices.filter((d) => d.type === "light" && d.on).length,
          lightsTotal: devices.filter((d) => d.type === "light").length,
          fansOn: devices.filter((d) => d.type === "fan" && d.on).length,
          fansTotal: devices.filter((d) => d.type === "fan").length,
        };
      })
      .filter((r) => (onlyWaste ? r.idle || r.wastePct > 15 : true))
      .filter(
        (r) =>
          !query ||
          r.room.code.toLowerCase().includes(query.toLowerCase()) ||
          r.building.name.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => b.kw - a.kw);
  }, [metrics.rooms, state.devices, query, onlyWaste]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classrooms"
        subtitle="Live per-room telemetry streamed from the classroom sensor network."
        actions={
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "sage-classrooms.csv",
                rows.map((r) => ({
                  room: r.room.code,
                  building: r.building.name,
                  occupancy: r.room.occupancy,
                  kw: r.kw.toFixed(2),
                  wasteKw: r.wasteKw.toFixed(2),
                  temperatureC: r.room.temperature.toFixed(1),
                  efficiency: r.efficiency,
                })),
              )
            }
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/10"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        }
      />

      <Panel
        title={`${rows.length} rooms`}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyWaste}
                onChange={(e) => setOnlyWaste(e.target.checked)}
                className="size-3.5 accent-[var(--color-waste)]"
              />
              Waste only
            </label>
            <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search room or block"
                className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Room</th>
                <th className="py-2 pr-3 font-medium">Building</th>
                <th className="py-2 pr-3 font-medium">Occupancy</th>
                <th className="py-2 pr-3 font-medium">Lights</th>
                <th className="py-2 pr-3 font-medium">Fans</th>
                <th className="py-2 pr-3 font-medium">Temp</th>
                <th className="py-2 pr-3 font-medium">Live load</th>
                <th className="py-2 pr-3 font-medium">Waste</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.room.id} className="border-b border-border/60 hover:bg-accent/5">
                  <td className="py-2 pr-3 font-medium text-foreground">{r.room.code}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.building.name}</td>
                  <td className="tabular py-2 pr-3">
                    {r.room.occupancy}/{r.room.capacity}
                  </td>
                  <td className="tabular py-2 pr-3">
                    {r.lightsOn}/{r.lightsTotal}
                  </td>
                  <td className="tabular py-2 pr-3">
                    {r.fansOn}/{r.fansTotal}
                  </td>
                  <td className="tabular py-2 pr-3">{formatNumber(r.room.temperature, 1)}°C</td>
                  <td className="tabular py-2 pr-3 text-primary">{formatNumber(r.kw, 2)} kW</td>
                  <td className="tabular py-2 pr-3 text-waste">{formatNumber(r.wasteKw, 2)} kW</td>
                  <td className="py-2 pr-3">
                    {r.idle ? (
                      <Pill tone="critical">Empty · powered</Pill>
                    ) : r.room.occupancy > 0 ? (
                      <Pill tone="energy">In use</Pill>
                    ) : (
                      <Pill tone="muted">Idle · off</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}