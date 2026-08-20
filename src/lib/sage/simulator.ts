import type {
  Alert,
  Building,
  CampusState,
  Device,
  DeviceType,
  HistoryPoint,
  Room,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILDINGS: Building[] = [
  { id: "b-a", code: "A", name: "Academic Block A", floors: 4 },
  { id: "b-b", code: "B", name: "Engineering Block B", floors: 3 },
  { id: "b-c", code: "C", name: "Science Block C", floors: 4 },
  { id: "b-d", code: "D", name: "Library & Admin D", floors: 2 },
];

const ROOM_TARGETS: Record<Building["id"], number> = {
  "b-a": 60,
  "b-b": 50,
  "b-c": 60,
  "b-d": 30,
};

const DEVICE_SPEC: Array<{ type: DeviceType; count: number; watts: number; label: string }> = [
  { type: "light", count: 6, watts: 36, label: "Tube light" },
  { type: "fan", count: 4, watts: 75, label: "Ceiling fan" },
  { type: "ac", count: 1, watts: 1400, label: "Split AC" },
  { type: "projector", count: 1, watts: 280, label: "Projector" },
];

export const CAMPUS_BUILDINGS = BUILDINGS;
export const CAMPUS_ROOM_COUNT = Object.values(ROOM_TARGETS).reduce((sum, count) => sum + count, 0);

export function formatClock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function createCampus(startMinutes = 10 * 60 + 20): CampusState {
  const rand = mulberry32(20260819);
  const rooms: Room[] = [];
  const devices: Device[] = [];

  BUILDINGS.forEach((building) => {
    const target = ROOM_TARGETS[building.id];
    const baseRoomsPerFloor = Math.floor(target / building.floors);
    const extraRooms = target % building.floors;
    for (let floor = 1; floor <= building.floors; floor++) {
      const roomsOnFloor = baseRoomsPerFloor + (floor <= extraRooms ? 1 : 0);
      for (let n = 1; n <= roomsOnFloor; n++) {
        const code = `${building.code}-${floor}${String(n).padStart(2, "0")}`;
        const id = `r-${code.toLowerCase()}`;
        const capacity = 30 + Math.floor(rand() * 40);
        rooms.push({
          id,
          code,
          name: `Room ${code}`,
          buildingId: building.id,
          floor,
          capacity,
          occupancy: 0,
          scheduledClass: false,
          temperature: 26 + rand() * 3,
          watts: 0,
          wasteWatts: 0,
          dailyKwh: 18 + rand() * 26,
        });
        DEVICE_SPEC.forEach((spec) => {
          for (let i = 1; i <= spec.count; i++) {
            devices.push({
              id: `${id}-${spec.type}-${i}`,
              roomId: id,
              buildingId: building.id,
              type: spec.type,
              label: `${spec.label} ${i}`,
              on: false,
              status: rand() > 0.97 ? "offline" : "online",
              ratedWatts: spec.watts,
              watts: 0,
            });
          }
        });
      }
    }
  });

  const state: CampusState = {
    tick: 0,
    clockMinutes: startMinutes,
    buildings: BUILDINGS,
    rooms,
    devices,
    alerts: [],
    history: [],
  };

  // Warm up so charts and daily totals are populated on first render.
  let warm = state;
  for (let i = 0; i < 30; i++) warm = advance(warm, mulberry32(1000 + i));
  return warm;
}

function occupancyTarget(minutes: number, room: Room, rand: () => number) {
  const hour = Math.floor(minutes / 60) % 24;
  if (hour < 8 || hour >= 20) return 0;
  const classPeriod = [9, 10, 11, 12, 14, 15, 16, 17].includes(hour);
  if (!classPeriod) return rand() > 0.7 ? Math.floor(room.capacity * 0.15 * rand()) : 0;
  if (rand() > 0.78) return 0; // free room this period
  return Math.max(4, Math.floor(room.capacity * (0.35 + rand() * 0.6)));
}

/** Advance the simulation by one tick (~2 simulated minutes). */
export function advance(prev: CampusState, rand: () => number = Math.random): CampusState {
  const tick = prev.tick + 1;
  const clockMinutes = (prev.clockMinutes + 2) % (24 * 60);
  const rooms: Room[] = [];
  const devices: Device[] = [];
  const newAlerts: Alert[] = [];
  const now = Date.now();

  const deviceByRoom = new Map<string, Device[]>();
  prev.devices.forEach((d) => {
    const list = deviceByRoom.get(d.roomId) ?? [];
    list.push(d);
    deviceByRoom.set(d.roomId, list);
  });

  prev.rooms.forEach((room) => {
    const changePeriod = clockMinutes % 60 < 2;
    let occupancy = room.occupancy;
    if (changePeriod || tick < 3) {
      occupancy = occupancyTarget(clockMinutes, room, rand);
    } else {
      occupancy = Math.max(0, occupancy + (rand() > 0.85 ? Math.round((rand() - 0.5) * 4) : 0));
      occupancy = Math.min(room.capacity, occupancy);
    }

    const occupied = occupancy > 0;
    const roomDevices = (deviceByRoom.get(room.id) ?? []).map((d) => ({ ...d }));

    // Scripted scenarios keep the demo interesting.
    roomDevices.forEach((d) => {
      if (d.status === "offline" && rand() > 0.995) d.status = "online";
      else if (d.status === "online" && rand() > 0.9985) d.status = "failing";
      else if (d.status === "failing" && rand() > 0.997) d.status = "offline";
    });

    const forgotten = !occupied && rand() > 0.72; // lights/fans left running
    roomDevices.forEach((d) => {
      if (d.status === "offline") {
        d.on = false;
        d.watts = 0;
        return;
      }
      if (d.type === "light") d.on = occupied ? rand() > 0.05 : forgotten;
      if (d.type === "fan") d.on = occupied ? rand() > 0.2 : forgotten && rand() > 0.35;
      if (d.type === "ac") d.on = occupied ? room.temperature > 27.5 : false;
      if (d.type === "projector") d.on = occupied && rand() > 0.6;
      const jitter = 0.92 + rand() * 0.18;
      const failMultiplier = d.status === "failing" ? 1.45 + rand() * 0.5 : 1;
      d.watts = d.on ? Math.round(d.ratedWatts * jitter * failMultiplier) : 0;
    });

    const watts = roomDevices.reduce((sum, d) => sum + d.watts, 0);
    const wasteWatts = occupied
      ? roomDevices
          .filter((d) => d.status === "failing" && d.on)
          .reduce((s, d) => s + Math.round(d.watts * 0.35), 0)
      : watts;

    const temperature = Math.min(
      33,
      Math.max(
        23,
        room.temperature + (occupied ? 0.05 : -0.06) + (rand() - 0.5) * 0.25,
      ),
    );

    const nextRoom: Room = {
      ...room,
      occupancy,
      scheduledClass: occupied,
      temperature,
      watts,
      wasteWatts,
      dailyKwh: room.dailyKwh + (watts / 1000) * (2 / 60),
    };
    rooms.push(nextRoom);
    devices.push(...roomDevices);

    const building = prev.buildings.find((b) => b.id === room.buildingId)!;
    const base = { roomId: room.id, buildingId: room.buildingId, createdAt: now, acknowledged: false };

    if (!occupied && watts > 150) {
      newAlerts.push({
        ...base,
        id: `al-${room.id}-empty-${tick}`,
        kind: "empty_room_consuming",
        severity: watts > 400 ? "critical" : "warning",
        title: `${room.code} is empty but drawing ${(watts / 1000).toFixed(2)} kW`,
        detail: `No occupancy detected in ${building.name}, yet ${roomDevices.filter((d) => d.on).length} devices are still running.`,
        wasteWatts: watts,
      });
    }
    if (watts > 2400) {
      newAlerts.push({
        ...base,
        id: `al-${room.id}-high-${tick}`,
        kind: "high_consumption",
        severity: "warning",
        title: `High consumption in ${room.code}`,
        detail: `Load reached ${(watts / 1000).toFixed(2)} kW, above the 2.40 kW room threshold.`,
        wasteWatts: Math.round(watts * 0.2),
      });
    }
    roomDevices
      .filter((d) => d.status === "failing" && rand() > 0.85)
      .forEach((d) => {
        newAlerts.push({
          ...base,
          id: `al-${d.id}-fail-${tick}`,
          kind: "device_failure",
          severity: "critical",
          title: `${d.label} failing in ${room.code}`,
          detail: `Device is drawing ${d.watts} W against a ${d.ratedWatts} W rating — likely degradation.`,
          wasteWatts: Math.round(d.watts * 0.35),
        });
      });
    if (occupancy > 0 && (Math.floor(clockMinutes / 60) < 8 || Math.floor(clockMinutes / 60) >= 20)) {
      newAlerts.push({
        ...base,
        id: `al-${room.id}-occ-${tick}`,
        kind: "unexpected_occupancy",
        severity: "info",
        title: `Unexpected occupancy in ${room.code}`,
        detail: `${occupancy} people detected outside scheduled campus hours.`,
        wasteWatts: 0,
      });
    }
  });

  const totalWatts = rooms.reduce((s, r) => s + r.watts, 0);
  const wasteWatts = rooms.reduce((s, r) => s + r.wasteWatts, 0);
  const occupancy = rooms.reduce((s, r) => s + r.occupancy, 0);

  const point: HistoryPoint = {
    t: clockMinutes,
    label: formatClock(clockMinutes),
    kw: Number((totalWatts / 1000).toFixed(2)),
    wasteKw: Number((wasteWatts / 1000).toFixed(2)),
    occupancy,
  };

  const alerts = [...newAlerts, ...prev.alerts].slice(0, 60);
  const history = [...prev.history, point].slice(-60);

  return { tick, clockMinutes, buildings: prev.buildings, rooms, devices, alerts, history };
}
