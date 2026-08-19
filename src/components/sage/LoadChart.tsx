import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HistoryPoint } from "@/lib/sage/types";

export function LoadChart({ data, height = 260 }: { data: HistoryPoint[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-waste)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-waste)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            interval="preserveStartEnd"
            minTickGap={40}
            stroke="var(--color-border)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            stroke="var(--color-border)"
            unit=" kW"
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="kw"
            name="Total load"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#loadFill)"
          />
          <Area
            type="monotone"
            dataKey="wasteKw"
            name="Wasted load"
            stroke="var(--color-waste)"
            strokeWidth={2}
            fill="url(#wasteFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}