import { createFileRoute } from "@tanstack/react-router";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CampusState } from "@/lib/sage/types";

export const Route = createFileRoute("/api/telemetry/acknowledge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { id?: string };
        if (!body.id) return new Response("Alert id is required", { status: 400 });

        const { data: latest, error: readError } = await supabaseAdmin
          .from("campus_telemetry")
          .select("id, state")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (readError) return Response.json({ error: readError.message }, { status: 500 });
        if (!latest) return new Response("Telemetry is not initialized", { status: 404 });

        const state = latest.state as unknown as CampusState;
        const nextState = {
          ...state,
          alerts: state.alerts.map((alert) =>
            alert.id === body.id ? { ...alert, acknowledged: true } : alert,
          ),
        };
        const { error } = await supabaseAdmin
          .from("campus_telemetry")
          .update({ state: nextState })
          .eq("id", latest.id);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
