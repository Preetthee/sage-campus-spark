export interface DailyEnergyRecord {
  date: string;
  kwh: number;
  wasteKwh: number;
  cost: number;
  co2Kg: number;
  peakKw: number;
  occupancy: number;
}

export async function getYearlyEnergyData(): Promise<DailyEnergyRecord[]> {
  const response = await fetch("/api/analytics/year");
  if (!response.ok) throw new Error("The local SAGE backend is not running.");
  const body = (await response.json()) as { records: DailyEnergyRecord[] };
  return body.records;
}
