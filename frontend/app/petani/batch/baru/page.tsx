"use client";

import { ArrowRight, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { createDemoBatch, uploadBatchPhoto } from "@/lib/demo-db";
import { useSessionUser } from "@/lib/hooks";
import type { AnalysisResult } from "@/lib/types";
import type { PhotoItem } from "@/components/CameraUploader";
import { isSupabaseMode } from "@/lib/supabase";
import { commodityCover, localBatchPhotoDataUrl } from "@/lib/commodity-images";


export default function NewBatchPage() {
  const user = useSessionUser();
  const router = useRouter();
  const [weight, setWeight] = useState("24");
  const [location, setLocation] = useState("Natar, Lampung Selatan");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reuseAnalysis, setReuseAnalysis] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reuse = new URLSearchParams(window.location.search).get("reuse") === "1";
    if (!reuse) return;
    const raw = sessionStorage.getItem("hasiltani:last-analysis");
    if (!raw) return;
    try { setReuseAnalysis(JSON.parse(raw) as AnalysisResult); } catch { /* ignore broken session payload */ }
  }, []);

  if (!user) return null;

  async function persist(result: AnalysisResult, photos: PhotoItem[] = []) {
    setSaving(true);
    setError(null);
    try {
      const uploadedPath = isSupabaseMode() && photos[0]
        ? await uploadBatchPhoto(user!.id, photos[0].file)
        : null;

      const localPhoto = !isSupabaseMode() && photos[0]
        ? await localBatchPhotoDataUrl(photos[0].file)
        : null;

      const batch = await createDemoBatch({
        farmerId: user!.id,
        commodity: result.commodity,
        weightKg: Number(weight),
        location,
        harvestDate: date,
        status: "analyzed",
        condition: result.raw_class || undefined,
        conditionLabel: result.condition_label || undefined,
        confidence: result.confidence,
        routingStatus: result.routing_status,
        coverImage: uploadedPath || localPhoto || commodityCover[result.commodity],
        modelVersion: result.model_version,
        analysisMode: result.mode,
        routes: result.routes,
      });
      sessionStorage.setItem(`hasiltani:analysis:${batch.id}`, JSON.stringify(result));
      router.push(`/petani/batch/${batch.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="detail-grid">
      <section className="dash-panel">
        <div className="panel-head"><h2>Informasi batch</h2><span className="status active">Langkah 1/2</span></div>
        <div className="form-row">
          <div className="field"><label>Berat batch (kg)</label><input type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} /></div>
          <div className="field"><label>Tanggal panen</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div className="field"><label>Lokasi batch</label><input value={location} onChange={e => setLocation(e.target.value)} /></div>
        <div className="alert alert-success">Hasil analisis dan foto pertama yang kamu kirim akan menjadi dokumentasi batch. Metadata model, kondisi visual, confidence, dan routing status tetap disimpan agar keputusan dapat ditelusuri.</div>
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      <section>
        {reuseAnalysis ? (
          <div className="form-card">
            <span className="eyebrow">Hasil Guest Scan ditemukan</span>
            <h1 style={{ fontSize: 38, marginBottom: 8 }}>Gunakan analisis ini untuk batch.</h1>
            <p className="muted" style={{ lineHeight: 1.65 }}>Kamu tidak perlu memindai ulang. HASILTANI akan memakai hasil analisis terakhir dan menyimpannya bersama data batch di sebelah kiri.</p>
            <div className="list-stack" style={{ marginTop: 20 }}>
              <div className="list-item"><div className="list-item-main"><small>Komoditas</small><b>{reuseAnalysis.commodity_label}</b></div></div>
              <div className="list-item"><div className="list-item-main"><small>Kondisi visual</small><b>{reuseAnalysis.condition_label ?? "Perlu Review"}</b></div><span className={`status ${reuseAnalysis.routing_status === "READY" ? "ready" : "review"}`}>{reuseAnalysis.routing_status}</span></div>
              <div className="list-item"><div className="list-item-main"><small>Confidence</small><b>{Math.round(reuseAnalysis.confidence * 100)}%</b></div><small>{reuseAnalysis.model_version}</small></div>
            </div>
            {reuseAnalysis.mode === "demo" && <div className="alert alert-warning">Hasil ini berasal dari fallback demo lokal. Metadata tersebut tetap disimpan apa adanya—tidak diubah menjadi seolah-olah hasil model final.</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={saving || Number(weight) <= 0} onClick={() => persist(reuseAnalysis)}><Save size={17} /> {saving ? "Menyimpan…" : "Simpan sebagai Batch"} <ArrowRight size={17} /></button>
              <button className="btn btn-ghost" onClick={() => setReuseAnalysis(null)}><RotateCcw size={17} /> Scan Ulang</button>
            </div>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.55, marginTop: 14 }}>Jika analisis lama tidak membawa file foto, batch memakai gambar komoditas sebagai placeholder. Saat kamu melakukan scan baru di halaman ini, foto pertama yang kamu kirim menjadi cover batch.</p>
          </div>
        ) : <ScanForm onResult={persist} />}
      </section>
    </div>
  );
}
