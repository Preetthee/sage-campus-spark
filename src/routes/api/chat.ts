import { createLovableAiGatewayProvider, getLovableAiGatewayRunId } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown; context?: unknown; model?: unknown };

const ALLOWED_MODELS = [
  "google/gemini-3.7-flash",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-flash-lite",
  "google/gemini-3.1-pro-preview",
] as const;
const DEFAULT_MODEL = ALLOWED_MODELS[0];

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key, getLovableAiGatewayRunId(request));

        const system = [
          "You are the SAGE Energy Guardian, an AI analyst for a smart campus energy platform.",
          "You receive a compact JSON summary of live campus telemetry (simulated IoT sensors).",
          "Answer concisely in markdown, quantify impact in kW, kWh, currency and kg CO2 when possible,",
          "and always end with a concrete recommended action. Never invent rooms or buildings that are not in the context.",
          "",
          "Live campus context:",
          JSON.stringify(body.context ?? {}),
        ].join("\n");

        const requested = typeof body.model === "string" ? body.model : DEFAULT_MODEL;
        const model = (ALLOWED_MODELS as readonly string[]).includes(requested)
          ? requested
          : DEFAULT_MODEL;

        try {
          const result = streamText({
            model: gateway(model),
            system,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI request failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
