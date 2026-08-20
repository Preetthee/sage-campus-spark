import { createFileRoute } from "@tanstack/react-router";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { advance, CAMPUS_ROOM_COUNT, createCampus } from "@/lib/sage/simulator";
import type { CampusState } from "@/lib/sage/types";

function isProducerRequest(request: Request) {
  const expected = process.env["SAGE_PRODUCER_KEY"];
  return Boolean(expected && request.headers.get("x-sage-producer-key") === expected);
}

export const Route = createFileRoute("/api/telemetry/advance")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isProducerRequest(request)) return new Response("Unauthorized", { status: 401 });

        const { data: latest, error: readError } = await supabaseAdmin
          .from("campus_telemetry")
          .select("state")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (readError) return Response.json({ error: readError.message }, { status: 500 });

        const previous = latest?.state as unknown as CampusState | null;
        // Reinitialize legacy demo data after the configured campus size changes.
        const state = previous?.rooms.length === CAMPUS_ROOM_COUNT ? advance(previous) : createCampus();
        const { error } = await supabaseAdmin.from("campus_telemetry").insert({
          source: "server-demo-producer",
          tick: state.tick,
          state,
        });

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ tick: state.tick, recordedAt: new Date().toISOString() });
      },
    },
  },
});
