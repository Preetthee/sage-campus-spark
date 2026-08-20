import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Panel, PageHeader, Pill } from "@/components/sage/ui";
import { sendDiscordTest } from "@/lib/discord/discord.functions";
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
  const { settings, updateSettings, running, setRunning, discordSyncedAt, discordAlertsSent } =
    useSage();
  const runTest = useServerFn(sendDiscordTest);
  const [testState, setTestState] = useState<string | null>(null);

  const handleTest = async () => {
    setTestState("Sending…");
    try {
      const res = await runTest({ data: { campusName: settings.campusName } });
      setTestState(
        res.ok
          ? "Test message delivered to Discord."
          : "No Discord webhook is configured yet on the server.",
      );
    } catch (error) {
      setTestState(error instanceof Error ? error.message : "Failed to reach Discord.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Dashboard preferences are held in this browser; campus telemetry is persisted in Supabase."
        actions={
          <Pill tone={running ? "energy" : "muted"}>
            {running ? "Telemetry running" : "Telemetry paused"}
          </Pill>
        }
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
            Refresh interval (ms): <span className="tabular text-foreground">{settings.tickMs}</span>
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
            {running ? "Pause telemetry" : "Resume telemetry"}
          </button>
          <p className="mt-4 text-[11px] text-muted-foreground">
            The simulator models occupancy, lighting, fans, air conditioning, device degradation and forgotten
            loads across every monitored classroom.
          </p>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="AI Energy Guardian"
          description="The chatbot on the AI Insights page"
        >
          <label className="flex items-start justify-between gap-4 rounded-md border border-border bg-background/40 p-3">
            <span className="text-xs text-muted-foreground">
              <span className="block text-sm font-medium text-foreground">Live AI responses</span>
              Uses Lovable AI (server-side, no keys to manage). Turn off to fall back to the built-in offline
              rule-based Guardian.
            </span>
            <input
              type="checkbox"
              checked={settings.liveAi}
              onChange={(e) => updateSettings({ liveAi: e.target.checked })}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
          </label>

          <label className="mt-4 block text-xs text-muted-foreground">
            AI provider
            <select
              value={settings.aiProvider}
              onChange={(e) =>
                updateSettings({ aiProvider: e.target.value as "lovable" | "openai-compatible" })
              }
              disabled={!settings.liveAi}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-50"
            >
              <option value="lovable">Lovable AI gateway</option>
              <option value="openai-compatible">External OpenAI-compatible API</option>
            </select>
          </label>

          <label className="mt-4 block text-xs text-muted-foreground">
            Guardian model
            <select
              value={settings.aiModel}
              onChange={(e) => updateSettings({ aiModel: e.target.value })}
              disabled={!settings.liveAi || settings.aiProvider !== "lovable"}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-50"
            >
              <option value="google/gemini-3.7-flash">Gemini 3.7 Flash — balanced default</option>
              <option value="google/gemini-3.5-flash">Gemini 3.5 Flash — fast</option>
              <option value="google/gemini-3.1-flash-lite">Gemini 3.1 Flash Lite — cheapest</option>
              <option value="google/gemini-3.1-pro-preview">Gemini 3.1 Pro — deepest reasoning</option>
            </select>
          </label>

          <p className="mt-4 text-[11px] text-muted-foreground">
            For an external API, add <span className="text-foreground">AI_API_BASE_URL</span>,{" "}
            <span className="text-foreground">AI_API_KEY</span>, and <span className="text-foreground">AI_MODEL</span>{" "}
            to server secrets (or <span className="text-foreground">.env.local</span> for local development). The API
            must support the OpenAI chat-completions format; OpenAI, Groq, OpenRouter, and compatible gateways work.
            Keys remain server-side and are never stored in this browser.
          </p>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Discord bot"
          description="Critical alerts, /status requests and AI Q&A in your server"
        >
          <label className="flex items-start justify-between gap-4 rounded-md border border-border bg-background/40 p-3">
            <span className="text-xs text-muted-foreground">
              <span className="block text-sm font-medium text-foreground">Discord integration</span>
              Pushes a telemetry snapshot every 30 seconds so the bot can answer even when this dashboard is
              closed, and forwards new alerts to your alert channel.
            </span>
            <input
              type="checkbox"
              checked={settings.discordEnabled}
              onChange={(e) => updateSettings({ discordEnabled: e.target.checked })}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-muted-foreground">
              Minimum severity to post
              <select
                value={settings.discordMinSeverity}
                onChange={(e) =>
                  updateSettings({ discordMinSeverity: e.target.value as "critical" | "warning" })
                }
                disabled={!settings.discordEnabled}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-50"
              >
                <option value="critical">Critical only</option>
                <option value="warning">Warning and above</option>
              </select>
            </label>

            <div className="rounded-md border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Last snapshot pushed</span>
                <span className="tabular text-foreground">
                  {discordSyncedAt ? new Date(discordSyncedAt).toLocaleTimeString() : "—"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Alerts posted this session</span>
                <span className="tabular text-foreground">{discordAlertsSent}</span>
              </div>
            </div>
          </div>

          <label className="mt-4 flex items-start justify-between gap-4 rounded-md border border-border bg-background/40 p-3">
            <span className="text-xs text-muted-foreground">
              <span className="block text-sm font-medium text-foreground">Quiet hours</span>
              Suppress alert posts overnight. Status requests from Discord always work.
            </span>
            <input
              type="checkbox"
              checked={settings.discordQuietHours}
              onChange={(e) => updateSettings({ discordQuietHours: e.target.checked })}
              disabled={!settings.discordEnabled}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
          </label>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-muted-foreground">
              Quiet from (hour): <span className="tabular text-foreground">{settings.discordQuietFrom}:00</span>
              <input
                type="range"
                min={0}
                max={23}
                value={settings.discordQuietFrom}
                onChange={(e) => updateSettings({ discordQuietFrom: Number(e.target.value) })}
                disabled={!settings.discordEnabled || !settings.discordQuietHours}
                className="mt-2 w-full accent-[var(--color-primary)] disabled:opacity-50"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Quiet until (hour): <span className="tabular text-foreground">{settings.discordQuietTo}:00</span>
              <input
                type="range"
                min={0}
                max={23}
                value={settings.discordQuietTo}
                onChange={(e) => updateSettings({ discordQuietTo: Number(e.target.value) })}
                disabled={!settings.discordEnabled || !settings.discordQuietHours}
                className="mt-2 w-full accent-[var(--color-primary)] disabled:opacity-50"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleTest()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Send test message
            </button>
            {testState ? <span className="text-[11px] text-muted-foreground">{testState}</span> : null}
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            The bot itself runs on your machine from the <span className="text-foreground">bot/</span> folder in this
            project — see <span className="text-foreground">bot/README.md</span> for the full setup. Slash commands
            available: <span className="text-foreground">/status</span>, <span className="text-foreground">/waste</span>,{" "}
            <span className="text-foreground">/alerts</span>, <span className="text-foreground">/ask</span>.
          </p>
        </Panel>
      </div>
    </div>
  );
}
