export type DeviceType = "light" | "fan" | "ac" | "projector";
export type DeviceStatus = "online" | "offline" | "failing";

export interface Device {
  id: string;
  roomId: string;
  buildingId: string;
  type: DeviceType;
  label: string;
  on: boolean;
  status: DeviceStatus;
  ratedWatts: number;
  watts: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  buildingId: string;
  floor: number;
  capacity: number;
  occupancy: number;
  scheduledClass: boolean;
  temperature: number;
  watts: number;
  wasteWatts: number;
  dailyKwh: number;
}

export interface Building {
  id: string;
  code: string;
  name: string;
  floors: number;
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertKind =
  | "empty_room_consuming"
  | "high_consumption"
  | "device_failure"
  | "device_offline"
  | "unexpected_occupancy";

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  roomId?: string;
  buildingId?: string;
  createdAt: number;
  wasteWatts: number;
  acknowledged: boolean;
}

export interface HistoryPoint {
  t: number;
  label: string;
  kw: number;
  wasteKw: number;
  occupancy: number;
}

export interface CampusState {
  tick: number;
  clockMinutes: number;
  buildings: Building[];
  rooms: Room[];
  devices: Device[];
  alerts: Alert[];
  history: HistoryPoint[];
}

export interface Settings {
  tariff: number;
  currency: string;
  co2PerKwh: number;
  tickMs: number;
  highConsumptionKw: number;
  campusName: string;
  liveAi: boolean;
  aiProvider: "lovable" | "openai-compatible";
  aiModel: string;
  discordEnabled: boolean;
  discordMinSeverity: "critical" | "warning";
  discordQuietHours: boolean;
  discordQuietFrom: number;
  discordQuietTo: number;
}

export interface RoomMetrics {
  room: Room;
  building: Building;
  kw: number;
  wasteKw: number;
  wastePct: number;
  efficiency: number;
  dailyCost: number;
  idle: boolean;
}

export interface BuildingMetrics {
  building: Building;
  kw: number;
  wasteKw: number;
  wastePct: number;
  rooms: number;
  occupancy: number;
  dailyKwh: number;
  dailyCost: number;
  efficiency: number;
}

export interface CampusMetrics {
  kw: number;
  wasteKw: number;
  wastePct: number;
  peakKw: number;
  idleKw: number;
  occupancy: number;
  activeRooms: number;
  totalRooms: number;
  efficiency: number;
  dailyKwh: number;
  weeklyKwh: number;
  monthlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
  co2Daily: number;
  co2Annual: number;
  co2Avoidable: number;
  annualSavings: number;
  sustainabilityScore: number;
  devicesOnline: number;
  devicesTotal: number;
  buildings: BuildingMetrics[];
  rooms: RoomMetrics[];
}
