import { createFileRoute } from "@tanstack/react-router";

import { Panel, PageHeader, Pill } from "@/components/sage/ui";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SAGE" },
      {
        name: "description",
        content:
          "Configure campus profile, electricity tariff, CO₂ factor, alert thresholds and simulator speed for the SAGE platform.",
      },
      { property: "og:title", content: "Settings — SAGE" },
      {
        property: "og:description",
        content: "Tariff, emissions factor, thresholds and simulator configuration.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings, running, setRunning } = useSage();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configuration is held in the browser for this demo deployment — nothing is persisted to a server."
        actions={<Pill tone={running ? "energy" : "muted"}>{running ? "Simulator running" : "Simulator paused"}</Pill>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Campus profile">
          <label className="block text-xs text-muted-foreground">
            Campus name
            <input
              value={settings.campusName}
              onChange={(e) => updateSettings({ campusName: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
            />
          </label>
          <label className="mt-4 block text-xs text-muted-foreground">
            Currency label
            <input
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
            />
          </label>
        </Panel>

        <Panel title="Tariff & emissions">
          <label className="block text-xs text-muted-foreground">
            Electricity tariff ({settings.currency}/kWh): <span className="tabular text-foreground">{settings.tariff}</span>
            <input
              type="range"
              min={2}
              max={25}
              step={0.5}
              value={settings.tariff}
              onChange={(e) => updateSettings({ tariff: Number(e.target.value) })}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
          </label>
          <label className="mt-5 block text-xs text-muted-foreground">
            Grid emissions factor (kg CO₂/kWh):{" "}
            <span className="tabular text-foreground">{settings.co2PerKwh}</span>
            <input
              type="range"
              min={0.2}
              max={1.2}
              step={0.01}
              value={settings.co2PerKwh}
              onChange={(e) => updateSettings({ co2PerKwh: Number(e.target.value) })}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
          </label>
        </Panel>

        <Panel title="Alert thresholds">
          <label className="block text-xs text-muted-foreground">
            High room consumption (kW):{" "}
            <span className="tabular text-foreground">{settings.highConsumptionKw}</span>
            <input
              type="range"
              min={1}
              max={6}
              step={0.1}
              value={settings.highConsumptionKw}
              onChange={(e) => updateSettings({ highConsumptionKw: Number(e.target.value) })}
              className="mt-2 w-full accent-[var(--color-waste)]"
            />
          </label>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Empty-room alerts trigger whenever occupancy is zero and the room still draws more than 150 W.
          </p>
        </Panel>

        <Panel title="Sensor simulator">
          <label className="block text-xs text-muted-foreground">
            Tick interval (ms): <span className="tabular text-foreground">{settings.tickMs}</span>
            <input
              type="range"
              min={500}
              max={6000}
              step={250}
              value={settings.tickMs}
              onChange={(e) => updateSettings({ tickMs: Number(e.target.value) })}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
          </label>
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className="mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            {running ? "Pause stream" : "Resume stream"}
          </button>
          <p className="mt-4 text-[11px] text-muted-foreground">
            The simulator models occupancy, lighting, fans, air conditioning, device degradation and forgotten
            loads across every monitored classroom.
          </p>
        </Panel>
      </div>
    </div>
  );
}
