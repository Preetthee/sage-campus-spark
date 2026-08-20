import type { CampusSnapshot, SnapshotAlert } from "@/lib/discord/shared";

import type { CampusMetrics, CampusState, Settings } from "./types";

export function buildSnapshot(
  state: CampusState,
  metrics: CampusMetrics,
  settings: Settings,
): CampusSnapshot {
  const active = state.alerts.filter((a) => !a.acknowledged);

  const activeAlerts: SnapshotAlert[] = active.slice(0, 15).map((a) => ({
    id: a.id,
    severity: a.severity,
    title: a.title,
    detail: a.detail,
    room: state.rooms.find((r) => r.id === a.roomId)?.code,
    wasteKw: Number((a.wasteWatts / 1000).toFixed(3)),
    createdAt: a.createdAt,
  }));

  const topWasteRooms = [...metrics.rooms]
    .sort((a, b) => b.wasteKw - a.wasteKw)
    .slice(0, 8)
    .map((r) => ({
      code: r.room.code,
      name: r.room.name,
      building: r.building.code,
      kw: Number(r.kw.toFixed(3)),
      wasteKw: Number(r.wasteKw.toFixed(3)),
      occupancy: r.room.occupancy,
      idle: r.idle,
    }));

  return {
    campusName: settings.campusName,
    currency: settings.currency,
    liveKw: Number(metrics.kw.toFixed(3)),
    wasteKw: Number(metrics.wasteKw.toFixed(3)),
    wastePct: Number(metrics.wastePct.toFixed(2)),
    efficiency: metrics.efficiency,
    dailyCost: Number(metrics.dailyCost.toFixed(2)),
    annualSavings: Number(metrics.annualSavings.toFixed(2)),
    co2Daily: Number(metrics.co2Daily.toFixed(2)),
    occupancy: metrics.occupancy,
    activeRooms: metrics.activeRooms,
    totalRooms: metrics.totalRooms,
    devicesOnline: metrics.devicesOnline,
    devicesTotal: metrics.devicesTotal,
    criticalAlerts: active.filter((a) => a.severity === "critical").length,
    warningAlerts: active.filter((a) => a.severity === "warning").length,
    buildings: metrics.buildings.map((b) => ({
      code: b.building.code,
      name: b.building.name,
      kw: Number(b.kw.toFixed(3)),
      wastePct: Number(b.wastePct.toFixed(2)),
      efficiency: b.efficiency,
      dailyCost: Number(b.dailyCost.toFixed(2)),
    })),
    topWasteRooms,
    activeAlerts,
  };
}
