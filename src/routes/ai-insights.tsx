import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Panel, PageHeader, Pill } from "@/components/sage/ui";
import { buildRecommendations, formatMoney, formatNumber } from "@/lib/sage/analytics";
import { SUGGESTED_PROMPTS, askGuardian, buildContext } from "@/lib/sage/guardian";
import { useSage } from "@/lib/sage/store";

export const Route = createFileRoute("/ai-insights")({
  head: () => ({
    meta: [
      { title: "AI Energy Guardian — SAGE" },
      {
        name: "description",
        content:
          "Ask the AI Energy Guardian why a room wastes power, how to cut today's bill, and which block is least efficient.",
      },
      { property: "og:title", content: "AI Energy Guardian — SAGE" },
      {
        property: "og:description",
        content: "Conversational energy analysis and prioritised recommendations.",
      },
    ],
  }),
  component: AiInsights,
});

interface Message {
  role: "user" | "guardian";
  text: string;
}

function AiInsights() {
  const { state, metrics, settings } = useSage();
  const ctx = useMemo(() => buildContext(state, metrics, settings), [state, metrics, settings]);
  const recs = useMemo(() => buildRecommendations(metrics, settings), [metrics, settings]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "guardian",
      text: "I'm the SAGE Energy Guardian. I read a compact summary of live campus telemetry — ask me about a room, a block, waste, cost or forecasts.",
    },
  ]);

  function ask(question: string) {
    if (!question.trim()) return;
    const answer = askGuardian(question, ctx, metrics, settings);
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "guardian", text: answer }]);
    setInput("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        subtitle="The Guardian receives structured campus summaries instead of raw sensor logs, keeping responses fast and token-efficient."
        actions={<Pill tone="info">Context: {ctx.worstRooms.length} hot rooms · {ctx.openAlerts} alerts</Pill>}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Energy Guardian" description="Demo intelligence over live simulated telemetry">
          <div className="flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary/15 px-3 py-2 text-xs text-foreground"
                    : "max-w-[92%] rounded-lg border border-border bg-background/50 px-3 py-2 text-xs leading-relaxed text-foreground"
                }
              >
                {m.role === "guardian" && (
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                    <Sparkles className="size-3" /> Guardian
                  </p>
                )}
                {m.text.split("\n").map((line, j) => (
                  <p key={j} className={j ? "mt-1.5" : ""}>
                    {line.replace(/\*\*/g, "")}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => ask(p)}
                className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="mt-3 flex items-center gap-2 rounded-md border border-border px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask why Room C-302 consumes so much electricity…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="text-primary" aria-label="Send question">
              <Send className="size-4" />
            </button>
          </form>
        </Panel>

        <Panel title="Context sent to the model" description="Token-optimised summary">
          <pre className="tabular overflow-x-auto rounded-md bg-background/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(ctx, null, 2)}
          </pre>
        </Panel>
      </div>

      <Panel title="Automatic recommendations" description="Generated from the current campus state">
        <div className="grid gap-3 md:grid-cols-2">
          {recs.map((r) => (
            <article key={r.id} className="rounded-md border border-border bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                <Pill tone={r.priority === "high" ? "critical" : r.priority === "medium" ? "waste" : "muted"}>
                  {r.priority} priority
                </Pill>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{r.reason}</p>
              <p className="mt-2 text-xs text-foreground">Action: {r.action}</p>
              <dl className="tabular mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <dt className="text-muted-foreground">Savings/yr</dt>
                  <dd className="text-primary">{formatMoney(r.savingsPerYear, settings)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">CO₂/yr</dt>
                  <dd className="text-accent">{formatNumber(r.co2PerYear, 0)} kg</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Confidence</dt>
                  <dd>{r.confidence}%</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}