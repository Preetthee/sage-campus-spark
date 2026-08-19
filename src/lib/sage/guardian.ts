import { buildRecommendations, formatMoney, formatNumber } from "./analytics";
import type { CampusMetrics, CampusState, Settings } from "./types";

/**
 * Demo "AI Energy Guardian".
 * It consumes the same compact context summary a Gemini-backed service would
 * receive, so swapping in a real model later means replacing askGuardian only.
 */
export interface GuardianContext {
  campus: string;
  kw: number;
  wastePct: number;
  efficiency: number;
  worstRooms: Array<{ code: string; kw: number; wastePct: number; occupancy: number }>;
  leastEfficientBuilding: string;
  openAlerts: number;
  dailyCost: string;
}

export function buildContext(
  state: CampusState,
  m: CampusMetrics,
  settings: Settings,
): GuardianContext {
  return {
    campus: settings.campusName,
    kw: Number(m.kw.toFixed(2)),
    wastePct: Number(m.wastePct.toFixed(1)),
    efficiency: m.efficiency,
    worstRooms: [...m.rooms]
      .sort((a, b) => b.wasteKw - a.wasteKw)
      .slice(0, 5)
      .map((r) => ({
        code: r.room.code,
        kw: Number(r.kw.toFixed(2)),
        wastePct: Number(r.wastePct.toFixed(0)),
        occupancy: r.room.occupancy,
      })),
    leastEfficientBuilding:
      [...m.buildings].sort((a, b) => a.efficiency - b.efficiency)[0]?.building.name ?? "—",
    openAlerts: state.alerts.filter((a) => !a.acknowledged).length,
    dailyCost: formatMoney(m.dailyCost, settings),
  };
}

export const SUGGESTED_PROMPTS = [
  "Which classroom wastes the most energy?",
  "How can we reduce today's electricity bill?",
  "Which building is least efficient?",
  "Summarize today's campus performance.",
];

export function askGuardian(
  question: string,
  ctx: GuardianContext,
  m: CampusMetrics,
  settings: Settings,
): string {
  const q = question.toLowerCase();
  const worst = ctx.worstRooms[0];
  const idle = m.rooms.filter((r) => r.idle);

  const roomMatch = m.rooms.find((r) => q.includes(r.room.code.toLowerCase()));
  if (roomMatch) {
    return [
      `**${roomMatch.room.code} — ${roomMatch.building.name}**`,
      `Live load is ${formatNumber(roomMatch.kw, 2)} kW with ${roomMatch.room.occupancy} occupants and ${formatNumber(roomMatch.room.temperature, 1)}°C indoor temperature.`,
      roomMatch.idle
        ? "The room is unoccupied yet devices are still drawing power — this is classic forgotten-load waste."
        : `Roughly ${roomMatch.wastePct.toFixed(0)}% of its draw is avoidable, mostly from degraded devices running above their rated wattage.`,
      `Recommended action: ${roomMatch.idle ? "cut lighting and fan circuits now" : "raise a maintenance work order"}. Estimated annual saving ${formatMoney(roomMatch.kw * 6 * 312 * settings.tariff * 0.25, settings)}.`,
    ].join("\n\n");
  }

  if (q.includes("waste") || q.includes("most energy") || q.includes("worst")) {
    return [
      `**${worst?.code ?? "No room"} is the biggest waster right now.**`,
      worst
        ? `It is drawing ${formatNumber(worst.kw, 2)} kW with ${worst.occupancy} occupants, and about ${worst.wastePct}% of that load is avoidable.`
        : "Campus waste is currently negligible.",
      `Campus-wide, ${idle.length} room${idle.length === 1 ? " is" : "s are"} consuming power while empty, totalling ${formatNumber(idle.reduce((s, r) => s + r.kw, 0), 2)} kW.`,
    ].join("\n\n");
  }

  if (q.includes("bill") || q.includes("cost") || q.includes("reduce") || q.includes("save")) {
    const recs = buildRecommendations(m, settings).slice(0, 3);
    return [
      `Today's projected spend is ${ctx.dailyCost} at ${settings.tariff} ${settings.currency}/kWh. Three highest-impact levers:`,
      ...recs.map(
        (r, i) => `${i + 1}. **${r.title}** — ${r.reason} Estimated ${formatMoney(r.savingsPerYear, settings)}/year.`,
      ),
      `Acting on all three trims campus waste from ${ctx.wastePct}% toward a 4–6% band.`,
    ].join("\n\n");
  }

  if (q.includes("building") || q.includes("block") || q.includes("efficient")) {
    const ranked = [...m.buildings].sort((a, b) => a.efficiency - b.efficiency);
    return [
      `**${ctx.leastEfficientBuilding} is the least efficient block.**`,
      ...ranked.map(
        (b) =>
          `- ${b.building.name}: ${formatNumber(b.kw, 2)} kW live, efficiency ${b.efficiency}/100, waste ${b.wastePct.toFixed(0)}%.`,
      ),
      "Prioritise an LED retrofit and occupancy-linked cutoffs in the lowest-scoring block first.",
    ].join("\n");
  }

  if (q.includes("alert") || q.includes("fail") || q.includes("maintenance")) {
    return [
      `There are ${ctx.openAlerts} open alerts.`,
      "Failing devices draw well above their rated wattage before they stop working, so they show up as sustained over-consumption rather than an outage.",
      "Recommended action: batch the failing-device work orders per block so a single technician visit clears them.",
    ].join("\n\n");
  }

  if (q.includes("predict") || q.includes("forecast") || q.includes("tomorrow")) {
    return [
      `Based on the last ${Math.max(1, m.rooms.length)} room readings and the current ${formatNumber(ctx.kw, 2)} kW load, tomorrow should land near ${formatNumber(m.dailyKwh * 1.03, 0)} kWh (confidence 84%).`,
      `That maps to about ${formatMoney(m.dailyKwh * 1.03 * settings.tariff, settings)} in electricity cost and ${formatNumber(m.dailyKwh * 1.03 * settings.co2PerKwh, 0)} kg CO₂.`,
    ].join("\n\n");
  }

  return [
    `**${ctx.campus} — live summary**`,
    `Campus load ${formatNumber(ctx.kw, 2)} kW across ${m.totalRooms} monitored rooms, ${m.activeRooms} currently in use with ${m.occupancy} people on site.`,
    `Efficiency score ${ctx.efficiency}/100 with ${ctx.wastePct}% avoidable load; ${ctx.openAlerts} alerts are open.`,
    `Projected spend today is ${ctx.dailyCost}, and eliminating current waste is worth roughly ${formatMoney(m.annualSavings, settings)} a year.`,
  ].join("\n\n");
}