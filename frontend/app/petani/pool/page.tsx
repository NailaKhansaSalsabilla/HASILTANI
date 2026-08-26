"use client";

import { CheckCircle2, GitMerge } from "lucide-react";
import { createDemoPool, updateDemoBatch } from "@/lib/demo-db";
import { useDemoDb, useSessionUser } from "@/lib/hooks";
import { commodityLabel, numberId } from "@/lib/format";

export default function PetaniPoolPage() {
  const db = useDemoDb();
  const user = useSessionUser();
  if (!db || !user) return null;

  const own = db.batches.filter(b => b.farmerId === user.id && b.commodity === "tomat" && b.condition === "ripe");
  const demoDemand = db.demands.find(d => d.id === "demand-tomat-50");
  const existing = db.pools.filter(p => p.memberBatchIds.some(id => own.some(b => b.id === id)));
  const existingTarget = demoDemand ? existing.find(p => p.targetDemandId === demoDemand.id) : undefined;

  async function create() {
    if (!demoDemand || existingTarget) return;
    const members = own.slice(0, 3);
    const total = members.reduce((sum, batch) => sum + batch.weightKg, 0);
    if (!members.length) return;
    await createDemoPool({
      targetDemandId: demoDemand.id,
      memberBatchIds: members.map(b => b.id),
      totalWeightKg: total,
      targetWeightKg: demoDemand.minimumVolumeKg,
      status: total >= demoDemand.minimumVolumeKg ? "ready" : "forming",
      commodity: "tomat",
    });
    await Promise.all(members.map(b => updateDemoBatch(b.id, { status: "pooled" })));
  }

  return <>
    <section className="welcome-card" style={{ minHeight: 220 }}>
      <span className="eyebrow" style={{ color: "#f5bb4d" }}>Harvest Pool</span>
      <h2>Gabungkan volume. Jangan hilangkan identitas batch.</h2>
      <p>Pool hanya menyatukan batch kompatibel untuk mengejar target buyer. Kondisi visual dan batch ID setiap anggota tetap terpisah.</p>
      {demoDemand && (
        <button className="btn btn-orange" onClick={create} disabled={Boolean(existingTarget)}>
          {existingTarget ? <><CheckCircle2 size={17} /> Pool siap · {numberId(existingTarget.totalWeightKg)} kg</> : <><GitMerge size={17} /> Bentuk Pool Demo · target {numberId(demoDemand.minimumVolumeKg)} kg</>}
        </button>
      )}
    </section>
    <section className="dash-panel" style={{ marginTop: 18 }}>
      <div className="panel-head"><h2>Pool terkait batchmu</h2><span className="status active">{existing.length} pool</span></div>
      {existing.length ? <div className="list-stack">{existing.map(p => <div className="list-item" key={p.id}><div className="list-item-main"><b>{commodityLabel[p.commodity]} · {numberId(p.totalWeightKg)} kg</b><small>{p.memberBatchIds.length} batch · target {numberId(p.targetWeightKg)} kg</small></div><span className={`status ${p.status}`}>{p.status === "ready" ? <><CheckCircle2 size={12} /> ready</> : p.status}</span></div>)}</div> : <div className="empty-state">Belum ada pool. Tekan tombol di atas untuk membentuk pool dari batch kompatibel.</div>}
    </section>
  </>;
}
