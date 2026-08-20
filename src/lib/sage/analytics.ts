import type {
  BuildingMetrics,
  CampusMetrics,
  CampusState,
  RoomMetrics,
  Settings,
} from "./types";

export const DEFAULT_SETTINGS: Settings = {
  tariff: 8.5,
  currency: "BDT",
  co2PerKwh: 0.68,
  tickMs: 8000,
  highConsumptionKw: 2.4,
  campusName: "Varendra University",
  liveAi: true,
  aiProvider: "openai-compatible",
  aiModel: "gemini-3.6-flash",
  discordEnabled: true,
  discordMinSeverity: "critical",
  discordQuietHours: false,
  discordQuietFrom: 22,
  discordQuietTo: 7,
};

function efficiencyFrom(wastePct: number) {
  return Math.max(0, Math.min(100, Math.round(100 - wastePct * 1.35)));
}

export function computeMetrics(state: CampusState, settings: Settings): CampusMetrics {
  const rooms: RoomMetrics[] = state.rooms.map((room) => {
    const building = state.buildings.find((b) => b.id === room.buildingId)!;
    const kw = room.watts / 1000;
    const wasteKw = room.wasteWatts / 1000;
    const wastePct = kw > 0 ? (wasteKw / kw) * 100 : 0;
    return {
      room,
      building,
      kw,
      wasteKw,
      wastePct,
      efficiency: efficiencyFrom(wastePct),
      dailyCost: room.dailyKwh * settings.tariff,
      idle: room.occupancy === 0 && room.watts > 100,
    };
  });

  const buildings: BuildingMetrics[] = state.buildings.map((building) => {
    const list = rooms.filter((r) => r.building.id === building.id);
    const kw = list.reduce((s, r) => s + r.kw, 0);
    const wasteKw = list.reduce((s, r) => s + r.wasteKw, 0);
    const wastePct = kw > 0 ? (wasteKw / kw) * 100 : 0;
    const dailyKwh = list.reduce((s, r) => s + r.room.dailyKwh, 0);
    return {
      building,
      kw,
      wasteKw,
      wastePct,
      rooms: list.length,
      occupancy: list.reduce((s, r) => s + r.room.occupancy, 0),
      dailyKwh,
      dailyCost: dailyKwh * settings.tariff,
      efficiency: efficiencyFrom(wastePct),
    };
  });

  const kw = buildings.reduce((s, b) => s + b.kw, 0);
  const wasteKw = buildings.reduce((s, b) => s + b.wasteKw, 0);
  const wastePct = kw > 0 ? (wasteKw / kw) * 100 : 0;
  const dailyKwh = state.rooms.reduce((s, r) => s + r.dailyKwh, 0);
  const weeklyKwh = dailyKwh * 6.4;
  const monthlyKwh = dailyKwh * 26;
  const peakKw = Math.max(kw, ...state.history.map((h) => h.kw));
  const idleKw = rooms.filter((r) => r.idle).reduce((s, r) => s + r.kw, 0);
  const co2Daily = dailyKwh * settings.co2PerKwh;
  const annualCost = monthlyKwh * 12 * settings.tariff;
  const annualSavings = annualCost * (wastePct / 100) * 0.7;

  return {
    kw,
    wasteKw,
    wastePct,
    peakKw,
    idleKw,
    occupancy: state.rooms.reduce((s, r) => s + r.occupancy, 0),
    activeRooms: state.rooms.filter((r) => r.occupancy > 0).length,
    totalRooms: state.rooms.length,
    efficiency: efficiencyFrom(wastePct),
    dailyKwh,
    weeklyKwh,
    monthlyKwh,
    dailyCost: dailyKwh * settings.tariff,
    monthlyCost: monthlyKwh * settings.tariff,
    annualCost,
    co2Daily,
    co2Annual: co2Daily * 312,
    co2Avoidable: co2Daily * 312 * (wastePct / 100) * 0.7,
    annualSavings,
    sustainabilityScore: Math.max(
      0,
      Math.min(100, Math.round(efficiencyFrom(wastePct) * 0.7 + (100 - Math.min(100, wastePct * 2)) * 0.3)),
    ),
    devicesOnline: state.devices.filter((d) => d.status === "online").length,
    devicesTotal: state.devices.length,
    buildings,
    rooms,
  };
}

export interface Prediction {
  horizon: string;
  kwh: number;
  cost: number;
  confidence: number;
  trend: number;
  savings: number;
}

export function buildPredictions(m: CampusMetrics, settings: Settings): Prediction[] {
  const base = m.kw;
  const rows: Array<[string, number, number, number]> = [
    ["Next hour", base * 1.04, 94, 1.04],
    ["Rest of today", m.dailyKwh * 0.32, 90, 1.02],
    ["Tomorrow", m.dailyKwh * 1.03, 84, 1.03],
    ["Next 7 days", m.weeklyKwh * 1.01, 78, 1.01],
    ["Next 30 days", m.monthlyKwh * 0.98, 71, 0.98],
    ["Next 12 months", m.monthlyKwh * 12 * 1.04, 63, 1.04],
  ];
  return rows.map(([horizon, kwh, confidence, trend]) => ({
    horizon,
    kwh,
    cost: kwh * settings.tariff,
    confidence,
    trend: (trend - 1) * 100,
    savings: kwh * settings.tariff * (m.wastePct / 100) * 0.7,
  }));
}

export interface Recommendation {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  reason: string;
  action: string;
  savingsPerYear: number;
  co2PerYear: number;
  confidence: number;
}

export function buildRecommendations(m: CampusMetrics, settings: Settings): Recommendation[] {
  const idleRooms = m.rooms.filter((r) => r.idle).sort((a, b) => b.kw - a.kw);
  const worst = [...m.rooms].sort((a, b) => b.wasteKw - a.wasteKw)[0];
  const leastEfficientBuilding = [...m.buildings].sort((a, b) => a.efficiency - b.efficiency)[0];
  const annual = (kw: number) => kw * 6 * 312 * settings.tariff;

  const recs: Recommendation[] = [];

  if (idleRooms.length) {
    recs.push({
      id: "rec-idle-lights",
      title: `Switch off lighting in ${idleRooms.length} unoccupied room${idleRooms.length > 1 ? "s" : ""}`,
      priority: "high",
      reason: `${idleRooms.map((r) => r.room.code).slice(0, 4).join(", ")} report zero occupancy while drawing ${idleRooms
        .reduce((s, r) => s + r.kw, 0)
        .toFixed(2)} kW.`,
      action: "Trigger occupancy-linked cutoff after 10 minutes of vacancy.",
      savingsPerYear: annual(idleRooms.reduce((s, r) => s + r.kw, 0)),
      co2PerYear: idleRooms.reduce((s, r) => s + r.kw, 0) * 6 * 312 * settings.co2PerKwh,
      confidence: 92,
    });
  }

  recs.push({
    id: "rec-fan-schedule",
    title: "Auto-stop fans 5 minutes after class ends",
    priority: "medium",
    reason: "Fan runtime consistently overshoots scheduled class periods across all blocks.",
    action: "Bind fan relays to the timetable service with a 5-minute grace window.",
    savingsPerYear: annual(m.kw * 0.06),
    co2PerYear: m.kw * 0.06 * 6 * 312 * settings.co2PerKwh,
    confidence: 81,
  });

  if (worst) {
    recs.push({
      id: "rec-maintenance",
      title: `Schedule maintenance for ${worst.room.code}`,
      priority: worst.wasteKw > 0.5 ? "high" : "medium",
      reason: `${worst.room.code} shows ${worst.wastePct.toFixed(0)}% wasted load, consistent with degraded ballast or motor wear.`,
      action: "Raise a work order for device inspection within 48 hours.",
      savingsPerYear: annual(worst.wasteKw),
      co2PerYear: worst.wasteKw * 6 * 312 * settings.co2PerKwh,
      confidence: 76,
    });
  }

  if (leastEfficientBuilding) {
    recs.push({
      id: "rec-retrofit",
      title: `Retrofit lighting in ${leastEfficientBuilding.building.name}`,
      priority: "medium",
      reason: `Efficiency score of ${leastEfficientBuilding.efficiency} is the lowest on campus.`,
      action: "Replace 36 W tube lights with 18 W LED equivalents.",
      savingsPerYear: leastEfficientBuilding.dailyCost * 312 * 0.22,
      co2PerYear: leastEfficientBuilding.dailyKwh * 312 * 0.22 * settings.co2PerKwh,
      confidence: 88,
    });
  }

  recs.push({
    id: "rec-peak",
    title: "Shift lab sessions out of the 12:00–14:00 peak",
    priority: "low",
    reason: `Peak campus load hit ${m.peakKw.toFixed(1)} kW, driving demand charges.`,
    action: "Move two afternoon lab blocks to the 16:00 slot.",
    savingsPerYear: m.annualCost * 0.03,
    co2PerYear: m.co2Annual * 0.03,
    confidence: 67,
  });

  return recs;
}

export function formatMoney(value: number, settings: Settings) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${settings.currency} ${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${settings.currency} ${(value / 1_000).toFixed(1)}k`;
  return `${settings.currency} ${value.toFixed(0)}`;
}

export function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
