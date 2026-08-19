import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, Sparkles } from "lucide-react";

import { Kpi, Panel, PageHeader, Pill } from "@/components/sage/ui";
import { askGuardian, buildContext } from "@/lib/sage/guardian";
import { useSage } from "@/lib/sage/store";
import type { AlertSeverity } from "@/lib/sage/types";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Smart Alerts — SAGE" },
      {
        name: "description",
        content:
          "Automatic alerts for empty rooms drawing power, high consumption, device failures, offline sensors and unexpected occupancy.",
      },
      { property: "og:title", content: "Smart Alerts — SAGE" },
      {
        property: "og:description",
        content: "Rule-based campus energy alerts with AI explanations.",
      },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const { state, metrics, settings, acknowledge } = useSage();
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const [explanation, setExplanation] = useState<string | null>(null);

  const ctx = useMemo(() => buildContext(state, metrics, settings), [state, metrics, settings]);
  const alerts = state.alerts.filter((a) => filter === "all" || a.severity === filter);
  const counts = {
    critical: state.alerts.filter((a) => a.severity === "critical").length,
    warning: state.alerts.filter((a) => a.severity === "warning").length,
    info: state.alerts.filter((a) => a.severity === "info").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Alerts"
        subtitle="The rules engine evaluates every sensor tick and raises alerts the moment waste appears."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Open alerts" value={String(state.alerts.filter((a) => !a.acknowledged).length)} />
        <Kpi label="Critical" value={String(counts.critical)} tone="critical" />
        <Kpi label="Warning" value={String(counts.warning)} tone="waste" />
        <Kpi label="Informational" value={String(counts.info)} tone="info" />
      </div>

      {explanation && (
        <Panel title="Guardian explanation" description="AI analysis of the selected alert">
          <div className="space-y-2 text-xs leading-relaxed text-foreground">
            {explanation.split("\n").map((line, i) => (
              <p key={i}>{line.replace(/\*\*/g, "")}</p>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Alert stream"
        description="Newest first"
        actions={
          <div className="flex gap-1">
            {(["all", "critical", "warning", "info"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={
                  filter === s
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
        <ul className="space-y-2">
          {alerts.length === 0 && (
            <li className="text-xs text-muted-foreground">Nothing to show for this filter.</li>
          )}
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-start gap-3 rounded-md border border-border bg-background/40 p-3"
            >
              <AlertTriangle
                className={
                  a.severity === "critical"
                    ? "mt-0.5 size-4 text-critical"
                    : a.severity === "warning"
                      ? "mt-0.5 size-4 text-waste"
                      : "mt-0.5 size-4 text-info"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{a.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.detail}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill
                    tone={
                      a.severity === "critical" ? "critical" : a.severity === "warning" ? "waste" : "info"
                    }
                  >
                    {a.severity}
                  </Pill>
                  <Pill tone="muted">{a.kind.replace(/_/g, " ")}</Pill>
                  {a.wasteWatts > 0 && (
                    <span className="tabular text-[11px] text-waste">{a.wasteWatts} W avoidable</span>
                  )}
                  {a.acknowledged && <Pill tone="energy">acknowledged</Pill>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExplanation(
                      askGuardian(
                        `${a.title}. ${a.detail}`,
                        ctx,
                        metrics,
                        settings,
                      ),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] hover:border-primary/40 hover:text-primary"
                >
                  <Sparkles className="size-3" /> Explain with AI
                </button>
                <button
                  type="button"
                  onClick={() => acknowledge(a.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] hover:bg-accent/10"
                >
                  <Check className="size-3" /> Acknowledge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}