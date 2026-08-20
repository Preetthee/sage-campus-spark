import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/discord/alerts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authorizeBot, jsonResponse, latestSnapshot } = await import(
          "@/lib/discord/delivery.server"
        );
        const { severityRank } = await import("@/lib/discord/shared");
        const denied = authorizeBot(request);
        if (denied) return denied;

        const snapshot = await latestSnapshot();
        if (!snapshot) return jsonResponse({ error: "no_data" }, 404);

        const alerts = [...snapshot.activeAlerts].sort(
          (a, b) => severityRank(b.severity) - severityRank(a.severity) || b.createdAt - a.createdAt,
        );

        return jsonResponse({
          createdAt: snapshot.createdAt,
          campusName: snapshot.campusName,
          critical: snapshot.criticalAlerts,
          warning: snapshot.warningAlerts,
          alerts,
        });
      },
    },
  },
});
