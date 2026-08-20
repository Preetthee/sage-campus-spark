import type { CampusState } from "./types";

export interface CurrentTelemetry {
  state: CampusState | null;
  recordedAt: string | null;
}

export async function getCurrentTelemetry(signal?: AbortSignal): Promise<CurrentTelemetry> {
  const response = await fetch("/api/telemetry/current", { signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Telemetry request failed (${response.status})`);
  }
  return (await response.json()) as CurrentTelemetry;
}

export async function acknowledgeTelemetryAlert(id: string) {
  const response = await fetch("/api/telemetry/acknowledge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error(`Alert acknowledgement failed (${response.status})`);
}
