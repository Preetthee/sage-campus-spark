import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Menu, Pause, Play, Radio } from "lucide-react";

import { formatClock } from "@/lib/sage/simulator";
import { formatNumber } from "@/lib/sage/analytics";
import { useSage } from "@/lib/sage/store";

export function SageTopBar() {
  const { state, metrics, settings, running, setRunning } = useSage();
  const openAlerts = state.alerts.filter((a) => !a.acknowledged).length;

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <Menu className="size-4 text-muted-foreground" />
          <span className="font-display text-sm font-semibold">SAGE</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio className={running ? "size-3.5 animate-pulse text-primary" : "size-3.5"} />
          <span>{running ? "Live" : "Paused"}</span>
          <span className="tabular text-foreground">{formatClock(state.clockMinutes)}</span>
          <span className="hidden sm:inline">· {settings.campusName}</span>
        </div>

        <dl className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Campus load</dt>
            <dd className="tabular font-semibold text-primary">{formatNumber(metrics.kw, 2)} kW</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Efficiency</dt>
            <dd className="tabular font-semibold text-foreground">{metrics.efficiency}/100</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Waste</dt>
            <dd className="tabular font-semibold text-waste">{formatNumber(metrics.wastePct, 1)}%</dd>
          </div>
        </dl>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/10"
          >
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {running ? "Pause simulator" : "Resume simulator"}
          </button>
          <Link
            to="/alerts"
            className="relative inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/10"
          >
            {openAlerts > 0 ? (
              <AlertTriangle className="size-3.5 text-critical" />
            ) : (
              <Bell className="size-3.5" />
            )}
            <span className="tabular">{openAlerts}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}