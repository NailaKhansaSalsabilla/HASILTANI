"use client";

import { ArrowRight, GitMerge, HandCoins, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createDemoOffer, updateDemoBatch } from "@/lib/demo-db";
import { useDemoDb, useSessionUser } from "@/lib/hooks";
import { matchDemand } from "@/lib/api";
import { commodityLabel, numberId, rupiah } from "@/lib/format";

type MatchRow={demand_id:string;buyer_name:string;score:number;offer_price_per_kg:number;potential_value:number;minimum_volume:number;missing_volume:number;pool_recommended:boolean;reasons:string[]};

export default function PetaniMatchPage(){
  const db=useDemoDb(); const user=useSessionUser();
  const [batchId,setBatchId]=useState(""); const [matches,setMatches]=useState<MatchRow[]>([]); const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null); const [sent,setSent]=useState<string[]>([]);
  const batches=useMemo(()=>db&&user?db.batches.filter(b=>b.farmerId===user.id&&b.routingStatus==="READY"&&b.condition):[],[db,user]);
  useEffect(()=>{if(typeof window!=="undefined"&&batches.length){const q=new URLSearchParams(window.location.search).get("batch"); setBatchId(q&&batches.some(b=>b.id===q)?q:batches[0].id)}},[batches]);
  const batch=batches.find(b=>b.id===batchId);
  async function run(){if(!db||!batch||!batch.condition)return;setLoading(true);setError(null);try{const out=await matchDemand({commodity:batch.commodity,condition:batch.condition,volumeKg:batch.weightKg,demands:db.demands.filter(d=>d.status==="active")});setMatches(out.matches);await updateDemoBatch(batch.id,{status:"matched"});}catch(e){setError(e instanceof Error?e.message:"Matching gagal.")}finally{setLoading(false)}}
  async function send(row:MatchRow){if(!db||!user||!batch)return;const demand=db.demands.find(d=>d.id===row.demand_id);if(!demand)return;await createDemoOffer({demandId:demand.id,batchId:batch.id,sellerId:user.id,buyerId:demand.buyerId,buyerName:demand.buyerName,offeredPricePerKg:demand.offerPricePerKg,acceptedWeightKg:Math.min(batch.weightKg,demand.minimumVolumeKg),status:"pending"});setSent(v=>[...v,row.demand_id]);await updateDemoBatch(batch.id,{status:"offered"});}
  if(!db||!user)return null;
  return <>
    <section className="dash-panel">
      <div className="panel-head"><div><h2>Pilih batch untuk dicocokkan</h2><span className="muted">Matching menggunakan kondisi, komoditas, volume, jarak, dan deadline. Offer price hanya secondary value.</span></div></div>
      {batches.length? <div className="form-row"><div className="field"><label>Batch</label><select value={batchId} onChange={e=>{setBatchId(e.target.value);setMatches([])}}>{batches.map(b=><option key={b.id} value={b.id}>{commodityLabel[b.commodity]} · {numberId(b.weightKg,1)} kg · {b.conditionLabel}</option>)}</select></div><div style={{display:"flex",alignItems:"end",paddingBottom:16}}><button className="btn btn-primary" onClick={run} disabled={loading}>{loading?<><LoaderCircle size={17}/> Menghitung…</>:<>Hitung Buyer Match <ArrowRight size={17}/></>}</button></div></div>:<div className="empty-state">Belum ada batch READY. Buat dan scan batch terlebih dahulu.</div>}
      {error&&<div className="alert alert-error">{error}</div>}
    </section>
    {matches.length>0&&<section className="dash-panel" style={{marginTop:18}}><div className="panel-head"><h2>Hasil matching</h2><span className="status active">{matches.length} cocok</span></div><div className="list-stack">{matches.map(row=><div className="list-item" key={row.demand_id}><div className="list-item-main"><b>{row.buyer_name} · Match {row.score}%</b><small>{rupiah(row.offer_price_per_kg)}/kg · potential value {rupiah(row.potential_value)} · minimum {numberId(row.minimum_volume)} kg</small><small>{row.reasons.slice(0,2).join(" · ")}</small></div><div className="list-actions">{row.pool_recommended&&<span className="status pending"><GitMerge size={12}/> kurang {numberId(row.missing_volume,1)} kg</span>}<button className="btn btn-primary btn-small" onClick={()=>send(row)} disabled={sent.includes(row.demand_id)}><HandCoins size={15}/>{sent.includes(row.demand_id)?"Offer terkirim":"Kirim Offer"}</button></div></div>)}</div></section>}
  </>;
}
