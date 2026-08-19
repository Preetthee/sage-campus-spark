import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  Cpu,
  DoorOpen,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Leaf,
  Settings as SettingsIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/buildings", label: "Buildings", icon: Building2 },
  { to: "/classrooms", label: "Classrooms", icon: DoorOpen },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/analytics", label: "Energy Analytics", icon: Activity },
  { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
  { to: "/predictions", label: "Predictions", icon: TrendingUp },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/executive", label: "Executive", icon: Gauge },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function SageSidebar() {
  return (
    <aside className="no-print hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Leaf className="size-5" />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none text-sidebar-foreground">SAGE</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Green Energy AI
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-sidebar-accent text-primary font-medium",
            }}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-[11px] text-muted-foreground">
        Pilot campus
        <p className="mt-1 text-sm font-medium text-sidebar-foreground">Varendra University</p>
      </div>
    </aside>
  );
}