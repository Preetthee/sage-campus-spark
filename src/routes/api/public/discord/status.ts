import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/discord/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authorizeBot, jsonResponse, latestSnapshot } = await import(
          "@/lib/discord/delivery.server"
        );
        const denied = authorizeBot(request);
        if (denied) return denied;

        const snapshot = await latestSnapshot();
        if (!snapshot) return jsonResponse({ error: "no_data" }, 404);

        const worst = [...snapshot.buildings].sort((a, b) => b.wastePct - a.wastePct)[0] ?? null;
        return jsonResponse({ snapshot, worstBuilding: worst });
      },
    },
  },
});
