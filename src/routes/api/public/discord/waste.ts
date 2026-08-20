import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/discord/waste")({
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

        return jsonResponse({
          createdAt: snapshot.createdAt,
          campusName: snapshot.campusName,
          currency: snapshot.currency,
          wasteKw: snapshot.wasteKw,
          wastePct: snapshot.wastePct,
          rooms: snapshot.topWasteRooms,
          buildings: snapshot.buildings,
        });
      },
    },
  },
});
