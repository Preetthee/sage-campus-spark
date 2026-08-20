import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = Number(process.env.BACKEND_PORT || 4000);
const ROOT = process.cwd();

function loadEnv() {
  for (const file of [resolve(ROOT, ".env"), resolve(ROOT, "bot", ".env")]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"']*)/i);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  }
}

loadEnv();

// Deterministic, realistic daily telemetry based on the campus simulator's four blocks.
function seeded(index) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function isoDate(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

function createYearData() {
  return Array.from({ length: 365 }, (_, position) => {
    const daysAgo = 364 - position;
    const date = new Date(`${isoDate(daysAgo)}T00:00:00`);
    const day = date.getDay();
    const weekdayFactor = day === 5 ? 0.45 : day === 6 ? 0.68 : 1;
    const seasonalFactor = 1 + 0.12 * Math.sin(((date.getMonth() + 1) / 12) * Math.PI * 2 - 1.1);
    const random = seeded(position);
    const kwh = Math.round((915 + random * 165) * weekdayFactor * seasonalFactor * 10) / 10;
    const wasteRate = 0.105 + seeded(position + 91) * 0.12;
    const wasteKwh = Math.round(kwh * wasteRate * 10) / 10;
    return {
      date: isoDate(daysAgo),
      kwh,
      wasteKwh,
      cost: Math.round(kwh * 8.5 * 100) / 100,
      co2Kg: Math.round(kwh * 0.68 * 10) / 10,
      peakKw: Math.round((72 + seeded(position + 41) * 25) * seasonalFactor * 10) / 10,
      occupancy: Math.round(430 * weekdayFactor + seeded(position + 13) * 120),
    };
  });
}

const year = createYearData();
const campusName = "Varendra University";

function summary() {
  const latest = year.at(-1);
  const recent = year.slice(-7);
  const totalKwh = year.reduce((sum, row) => sum + row.kwh, 0);
  const totalWasteKwh = year.reduce((sum, row) => sum + row.wasteKwh, 0);
  return {
    campusName,
    currency: "BDT",
    latest,
    totalKwh: Math.round(totalKwh * 10) / 10,
    totalWasteKwh: Math.round(totalWasteKwh * 10) / 10,
    wastePct: Math.round((totalWasteKwh / totalKwh) * 1000) / 10,
    weeklyKwh: Math.round(recent.reduce((sum, row) => sum + row.kwh, 0) * 10) / 10,
    worstWasteDate: [...year].sort((a, b) => b.wasteKwh - a.wasteKwh)[0],
  };
}

function liveSnapshot() {
  const latest = year.at(-1);
  const wasteKw = Math.round((latest.wasteKwh / 10) * 100) / 100;
  const liveKw = Math.round((latest.kwh / 8.5) * 100) / 100;
  return {
    createdAt: new Date().toISOString(), campusName, currency: "BDT", liveKw, wasteKw,
    wastePct: Math.round((wasteKw / liveKw) * 1000) / 10, efficiency: 79,
    dailyCost: latest.cost, co2Daily: latest.co2Kg, occupancy: latest.occupancy,
    activeRooms: 18, totalRooms: 26, devicesOnline: 300, devicesTotal: 312,
    criticalAlerts: 1, warningAlerts: 3,
    buildings: [
      { name: "Academic Block A", wastePct: 18.4 }, { name: "Engineering Block B", wastePct: 21.1 },
      { name: "Science Block C", wastePct: 15.7 }, { name: "Library & Admin D", wastePct: 11.2 },
    ],
  };
}

function authorized(request) {
  const expected = process.env.SAGE_BOT_TOKEN;
  return Boolean(expected && request.headers["x-sage-bot-token"] === expected);
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
  response.end(JSON.stringify(body));
}

function botResponse(path, response) {
  const current = liveSnapshot();
  if (path.endsWith("/status")) {
    return send(response, 200, { snapshot: current, worstBuilding: [...current.buildings].sort((a, b) => b.wastePct - a.wastePct)[0] });
  }
  if (path.endsWith("/waste")) {
    return send(response, 200, { createdAt: current.createdAt, campusName, wasteKw: current.wasteKw, wastePct: current.wastePct, rooms: [
      { id: "r-c-302", code: "C-302", building: "Science Block C", kw: 2.31, wasteKw: 0.71, occupancy: 0, idle: true },
      { id: "r-b-201", code: "B-201", building: "Engineering Block B", kw: 1.89, wasteKw: 0.48, occupancy: 4, idle: false },
      { id: "r-a-103", code: "A-103", building: "Academic Block A", kw: 1.42, wasteKw: 0.39, occupancy: 0, idle: true },
    ] });
  }
  if (path.endsWith("/alerts")) return send(response, 200, { createdAt: current.createdAt, campusName, critical: 1, warning: 3, alerts: [] });
  return send(response, 404, { error: "not_found" });
}

const server = createServer((request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (request.method === "GET" && url.pathname === "/api/health") return send(response, 200, { ok: true, records: year.length });
  if (request.method === "GET" && url.pathname === "/api/analytics/year") return send(response, 200, { campusName, currency: "BDT", records: year });
  if (request.method === "GET" && url.pathname === "/api/analytics/summary") return send(response, 200, summary());
  if (url.pathname.startsWith("/api/public/discord/")) {
    if (!authorized(request)) return send(response, 401, { error: "unauthorized" });
    if (request.method === "GET") return botResponse(url.pathname, response);
    if (request.method === "POST" && url.pathname.endsWith("/ask")) {
      let raw = "";
      request.on("data", (chunk) => { raw += chunk; });
      return request.on("end", () => {
        const question = JSON.parse(raw || "{}").question || "";
        const worst = summary().worstWasteDate;
        const answer = /most.*wast|worst.*date|wast.*date/i.test(question)
          ? `The highest energy-waste day in the available year was ${worst.date}: ${worst.wasteKwh.toFixed(1)} kWh wasted from ${worst.kwh.toFixed(1)} kWh consumed. Review room shutdown schedules and AC settings for that date.`
          : `SAGE has 365 days of campus telemetry. The latest day used ${summary().latest.kwh.toFixed(1)} kWh with ${summary().latest.wasteKwh.toFixed(1)} kWh avoidable. Ask which date had the most waste for the historical peak.`;
        send(response, 200, { answer, snapshotAt: new Date().toISOString() });
      });
    }
  }
  return send(response, 404, { error: "not_found" });
});

server.listen(PORT, () => console.log(`SAGE backend running at http://localhost:${PORT} with ${year.length} daily records`));
