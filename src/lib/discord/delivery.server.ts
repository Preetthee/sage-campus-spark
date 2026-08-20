import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SEVERITY_COLORS, type CampusSnapshot, type SnapshotAlert } from "./shared";

export function admin(): SupabaseClient {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function saveSnapshot(snapshot: CampusSnapshot) {
  const db = admin();
  const { error } = await db.from("campus_snapshots").insert({
    campus_name: snapshot.campusName,
    currency: snapshot.currency,
    live_kw: snapshot.liveKw,
    waste_kw: snapshot.wasteKw,
    waste_pct: snapshot.wastePct,
    efficiency: snapshot.efficiency,
    daily_cost: snapshot.dailyCost,
    annual_savings: snapshot.annualSavings,
    co2_daily: snapshot.co2Daily,
    occupancy: snapshot.occupancy,
    active_rooms: snapshot.activeRooms,
    total_rooms: snapshot.totalRooms,
    devices_online: snapshot.devicesOnline,
    devices_total: snapshot.devicesTotal,
    critical_alerts: snapshot.criticalAlerts,
    warning_alerts: snapshot.warningAlerts,
    buildings: snapshot.buildings,
    top_waste_rooms: snapshot.topWasteRooms,
    active_alert_list: snapshot.activeAlerts,
  });
  if (error) throw new Error(error.message);

  // Keep the table small: drop anything older than a day.
  await db
    .from("campus_snapshots")
    .delete()
    .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
}

export interface StoredSnapshot extends CampusSnapshot {
  createdAt: string;
}

export async function latestSnapshot(): Promise<StoredSnapshot | null> {
  const { data, error } = await admin()
    .from("campus_snapshots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const num = (v: unknown) => Number(v ?? 0);
  return {
    createdAt: String(row["created_at"]),
    campusName: String(row["campus_name"] ?? "Campus"),
    currency: String(row["currency"] ?? "BDT"),
    liveKw: num(row["live_kw"]),
    wasteKw: num(row["waste_kw"]),
    wastePct: num(row["waste_pct"]),
    efficiency: num(row["efficiency"]),
    dailyCost: num(row["daily_cost"]),
    annualSavings: num(row["annual_savings"]),
    co2Daily: num(row["co2_daily"]),
    occupancy: num(row["occupancy"]),
    activeRooms: num(row["active_rooms"]),
    totalRooms: num(row["total_rooms"]),
    devicesOnline: num(row["devices_online"]),
    devicesTotal: num(row["devices_total"]),
    criticalAlerts: num(row["critical_alerts"]),
    warningAlerts: num(row["warning_alerts"]),
    buildings: (row["buildings"] as CampusSnapshot["buildings"]) ?? [],
    topWasteRooms: (row["top_waste_rooms"] as CampusSnapshot["topWasteRooms"]) ?? [],
    activeAlerts: (row["active_alert_list"] as CampusSnapshot["activeAlerts"]) ?? [],
  };
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export async function postToDiscord(embeds: DiscordEmbed[], content?: string) {
  const webhook = process.env["DISCORD_WEBHOOK_URL"];
  if (!webhook) throw new Error("DISCORD_WEBHOOK_URL is not configured");

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "SAGE Energy Guardian", content, embeds }),
  });
  if (!res.ok) {
    throw new Error(`Discord webhook failed (${res.status}): ${await res.text()}`);
  }
}

export function alertEmbed(alert: SnapshotAlert, campusName: string, currency: string, tariff: number): DiscordEmbed {
  const dailyWasteKwh = alert.wasteKw * 24;
  return {
    title: `${alert.severity === "critical" ? "🔴" : "🟠"} ${alert.title}`,
    description: alert.detail,
    color: SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.info,
    fields: [
      ...(alert.room ? [{ name: "Room", value: alert.room, inline: true }] : []),
      { name: "Wasted load", value: `${alert.wasteKw.toFixed(2)} kW`, inline: true },
      {
        name: "If left 24 h",
        value: `${dailyWasteKwh.toFixed(1)} kWh · ${currency} ${(dailyWasteKwh * tariff).toFixed(0)}`,
        inline: true,
      },
    ],
    footer: { text: `${campusName} · SAGE` },
    timestamp: new Date(alert.createdAt || Date.now()).toISOString(),
  };
}

/** Returns true when this alert id had not been posted before. */
export async function claimAlert(alert: SnapshotAlert): Promise<boolean> {
  const { error } = await admin().from("discord_alert_log").insert({
    alert_id: alert.id,
    severity: alert.severity,
    title: alert.title,
    detail: alert.detail,
    delivered: true,
  });
  if (error) {
    if (error.code === "23505") return false; // duplicate
    if (error.message.toLowerCase().includes("duplicate")) return false;
    throw new Error(error.message);
  }
  return true;
}
