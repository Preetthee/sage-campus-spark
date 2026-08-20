import { createFileRoute } from "@tanstack/react-router";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CampusState } from "@/lib/sage/types";

export const Route = createFileRoute("/api/telemetry/current")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabaseAdmin
          .from("campus_telemetry")
          .select("created_at, state")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!data) return Response.json({ state: null, recordedAt: null });

        return Response.json({
          state: data.state as unknown as CampusState,
          recordedAt: data.created_at,
        });
      },
    },
  },
});
