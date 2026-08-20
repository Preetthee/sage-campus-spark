import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

export const Route = createFileRoute("/api/public/discord/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authorizeBot, jsonResponse, latestSnapshot } = await import(
          "@/lib/discord/delivery.server"
        );
        const denied = authorizeBot(request);
        if (denied) return denied;

        const body = (await request.json()) as { question?: unknown; asker?: unknown };
        const question = typeof body.question === "string" ? body.question.trim() : "";
        if (!question) return jsonResponse({ error: "question is required" }, 400);

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return jsonResponse({ error: "AI is not configured" }, 500);

        const snapshot = await latestSnapshot();
        if (!snapshot) return jsonResponse({ error: "no_data" }, 404);

        const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(key);

        const system = [
          "You are the SAGE Energy Guardian answering questions in a Discord channel.",
          "You get a JSON snapshot of live campus energy telemetry.",
          "Reply in plain text suitable for Discord (short paragraphs, hyphen bullets, no markdown headings).",
          "Keep it under 1200 characters. Quantify impact in kW, kWh, currency and kg CO2.",
          "End with one concrete recommended action. Never invent rooms or buildings.",
          "",
          `Snapshot taken at ${snapshot.createdAt}:`,
          JSON.stringify(snapshot),
        ].join("\n");

        try {
          const result = streamText({
            model: gateway("google/gemini-3.7-flash"),
            system,
            prompt: question,
          });
          const answer = await result.text;
          return jsonResponse({
            answer: answer.slice(0, 1800),
            snapshotAt: snapshot.createdAt,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI request failed";
          return jsonResponse({ error: message }, 502);
        }
      },
    },
  },
});
