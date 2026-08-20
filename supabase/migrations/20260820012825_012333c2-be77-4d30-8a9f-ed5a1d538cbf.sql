CREATE TABLE public.campus_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  campus_name TEXT NOT NULL DEFAULT 'Campus',
  currency TEXT NOT NULL DEFAULT 'BDT',
  live_kw NUMERIC NOT NULL DEFAULT 0,
  waste_kw NUMERIC NOT NULL DEFAULT 0,
  waste_pct NUMERIC NOT NULL DEFAULT 0,
  efficiency NUMERIC NOT NULL DEFAULT 0,
  daily_cost NUMERIC NOT NULL DEFAULT 0,
  annual_savings NUMERIC NOT NULL DEFAULT 0,
  co2_daily NUMERIC NOT NULL DEFAULT 0,
  occupancy INTEGER NOT NULL DEFAULT 0,
  active_rooms INTEGER NOT NULL DEFAULT 0,
  total_rooms INTEGER NOT NULL DEFAULT 0,
  devices_online INTEGER NOT NULL DEFAULT 0,
  devices_total INTEGER NOT NULL DEFAULT 0,
  critical_alerts INTEGER NOT NULL DEFAULT 0,
  warning_alerts INTEGER NOT NULL DEFAULT 0,
  buildings JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_waste_rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_alert_list JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX campus_snapshots_created_at_idx ON public.campus_snapshots (created_at DESC);

GRANT ALL ON public.campus_snapshots TO service_role;
ALTER TABLE public.campus_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access to snapshots" ON public.campus_snapshots FOR SELECT TO authenticated USING (false);

CREATE TABLE public.discord_alert_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_id TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  delivered BOOLEAN NOT NULL DEFAULT false
);

GRANT ALL ON public.discord_alert_log TO service_role;
ALTER TABLE public.discord_alert_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access to alert log" ON public.discord_alert_log FOR SELECT TO authenticated USING (false);