import type { AnalysisResult, Commodity, Demand } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function analyzeProduce(commodity: Commodity, files: File[]): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("commodity", commodity);
  files.forEach((file) => form.append("files", file, file.name));
  const res = await fetch(`${API_URL}/v1/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "Analisis gagal. Pastikan FastAPI berjalan di port 8000.");
  }
  return res.json();
}

export async function matchDemand(input: { commodity: Commodity; condition: string; volumeKg: number; demands: Demand[] }) {
  const payload = {
    commodity: input.commodity,
    condition: input.condition,
    volume_kg: input.volumeKg,
    demands: input.demands.map((d) => ({
      id: d.id,
      buyer_name: d.buyerName,
      commodity: d.commodity,
      accepted_conditions: d.acceptedConditions,
      minimum_volume: d.minimumVolumeKg,
      offer_price_per_kg: d.offerPricePerKg,
      distance_km: Math.min(d.radiusKm * 0.45, d.radiusKm),
      deadline_days: Math.max(0, Math.ceil((new Date(d.deadline).getTime() - Date.now()) / 86400000)),
    })),
  };
  const res = await fetch(`${API_URL}/v1/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Demand matching gagal. Pastikan FastAPI berjalan.");
  return res.json() as Promise<{ matches: Array<{ demand_id: string; buyer_name: string; score: number; offer_price_per_kg: number; potential_value: number; minimum_volume: number; missing_volume: number; pool_recommended: boolean; reasons: string[] }> }>;
}
