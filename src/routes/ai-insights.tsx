import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

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
          "Chat with the AI Energy Guardian about why a room wastes power, how to cut today's bill, and which block is least efficient.",
      },
      { property: "og:title", content: "AI Energy Guardian — SAGE" },
      {
        property: "og:description",
        content: "Conversational energy analysis and prioritised recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiInsights,
});

type OfflineMessage = { role: "user" | "assistant"; text: string };

function AiInsights() {
  const { state, metrics, settings } = useSage();
  const ctx = useMemo(() => buildContext(state, metrics, settings), [state, metrics, settings]);
  const recs = useMemo(() => buildRecommendations(metrics, settings), [metrics, settings]);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  // Live context is read at send time so the model always sees the latest telemetry.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const modelRef = useRef(settings.aiModel);
  modelRef.current = settings.aiModel;
  const providerRef = useRef(settings.aiProvider);
  providerRef.current = settings.aiProvider;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            messages,
            context: ctxRef.current,
            model: modelRef.current,
            provider: providerRef.current,
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: "sage-guardian",
    transport,
    onError: (err) => toast.error(err.message || "The Guardian could not answer right now."),
  });

  const [offline, setOffline] = useState<OfflineMessage[]>([]);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, offline, busy]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setInput("");
    if (!settings.liveAi) {
      setOffline((prev) => [
        ...prev,
        { role: "user", text: q },
        { role: "assistant", text: askGuardian(q, ctxRef.current, metrics, settings) },
      ]);
      return;
    }
    if (busy) return;
    void sendMessage({ text: q });
  }

  const thread: OfflineMessage[] = settings.liveAi
    ? messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.parts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join(""),
      }))
    : offline;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        subtitle="The Guardian receives structured campus summaries instead of raw sensor logs, keeping responses fast and token-efficient."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={settings.liveAi ? "energy" : "muted"}>
              {settings.liveAi
                ? settings.aiProvider === "lovable"
                  ? `Lovable AI · ${settings.aiModel.split("/")[1]}`
                  : "External AI API"
                : "Offline demo mode"}
            </Pill>
            <Pill tone="info">
              Context: {ctx.worstRooms.length} hot rooms · {ctx.openAlerts} alerts
            </Pill>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Energy Guardian"
          description={
            settings.liveAi
              ? "Powered by the configured AI provider over live simulated telemetry"
              : "Local rule-based fallback"
          }
        >
          <div ref={scroller} className="flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1">
            <div className="max-w-[92%] rounded-lg border border-border bg-background/50 px-3 py-2 text-xs leading-relaxed text-foreground">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="size-3" /> Guardian
              </p>
              I'm the SAGE Energy Guardian. I read a compact summary of live campus telemetry — ask me about a
              room, a block, waste, cost or forecasts.
            </div>

            {thread.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary/15 px-3 py-2 text-xs text-foreground"
                    : "max-w-[92%] rounded-lg border border-border bg-background/50 px-3 py-2 text-xs leading-relaxed text-foreground"
                }
              >
                {m.role === "assistant" && (
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                    <Sparkles className="size-3" /> Guardian
                  </p>
                )}
                {m.role === "assistant" ? (
                  <div className="space-y-2 [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{m.text}</p>
                )}
              </div>
            ))}

            {busy && (
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Guardian is analysing telemetry…
              </p>
            )}
            {error && (
              <p className="text-[11px] text-[var(--color-critical)]">
                {error.message || "The Guardian could not answer right now."}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy}
                onClick={() => ask(p)}
                className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50"
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
            <button type="submit" disabled={busy} className="text-primary disabled:opacity-40" aria-label="Send question">
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
