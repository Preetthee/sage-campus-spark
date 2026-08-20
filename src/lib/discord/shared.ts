export interface SnapshotBuilding {
  code: string;
  name: string;
  kw: number;
  wastePct: number;
  efficiency: number;
  dailyCost: number;
}

export interface SnapshotRoom {
  code: string;
  name: string;
  building: string;
  kw: number;
  wasteKw: number;
  occupancy: number;
  idle: boolean;
}

export interface SnapshotAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  room?: string | undefined;
  wasteKw: number;
  createdAt: number;
}

export interface CampusSnapshot {
  campusName: string;
  currency: string;
  liveKw: number;
  wasteKw: number;
  wastePct: number;
  efficiency: number;
  dailyCost: number;
  annualSavings: number;
  co2Daily: number;
  occupancy: number;
  activeRooms: number;
  totalRooms: number;
  devicesOnline: number;
  devicesTotal: number;
  criticalAlerts: number;
  warningAlerts: number;
  buildings: SnapshotBuilding[];
  topWasteRooms: SnapshotRoom[];
  activeAlerts: SnapshotAlert[];
}

export const SEVERITY_COLORS = {
  critical: 0xef4444,
  warning: 0xf59e0b,
  info: 0x22c55e,
} as const;

export function severityRank(s: string) {
  return s === "critical" ? 3 : s === "warning" ? 2 : 1;
}

export function relativeAge(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 90) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}
