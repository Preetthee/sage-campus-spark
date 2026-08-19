import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  unit,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "default" | "energy" | "waste" | "critical" | "info";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    energy: "text-primary",
    waste: "text-waste",
    critical: "text-critical",
    info: "text-info",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className={cn("opacity-80", toneClass)}>{icon}</span>}
      </div>
      <p className={cn("tabular mt-3 text-2xl font-semibold", toneClass)}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "energy" | "waste" | "critical" | "info" | "muted";
  children: ReactNode;
}) {
  const map = {
    energy: "bg-primary/12 text-primary border-primary/30",
    waste: "bg-waste/12 text-waste border-waste/30",
    critical: "bg-critical/12 text-critical border-critical/30",
    info: "bg-info/12 text-info border-info/30",
    muted: "bg-muted text-muted-foreground border-border",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        map,
      )}
    >
      {children}
    </span>
  );
}

export function Meter({ value, tone = "energy" }: { value: number; tone?: "energy" | "waste" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", tone === "energy" ? "bg-primary" : "bg-waste")}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "")}"`).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}