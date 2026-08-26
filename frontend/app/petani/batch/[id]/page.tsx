"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useDemoDb } from "@/lib/hooks";
import { commodityLabel, dateId, numberId } from "@/lib/format";
import { resolveBatchCover } from "@/lib/commodity-images";
import type { AnalysisResult } from "@/lib/types";
import { useEffect, useState } from "react";

export default function BatchDetail(){
  const {id}=useParams<{id:string}>(); const db=useDemoDb(); const [analysis,setAnalysis]=useState<AnalysisResult|null>(null);
  useEffect(()=>{const raw=sessionStorage.getItem(`hasiltani:analysis:${id}`); if(raw)setAnalysis(JSON.parse(raw));},[id]);
  const batch=db?.batches.find(b=>b.id===id); if(!db) return null; if(!batch) return <div className="empty-state">Batch tidak ditemukan.</div>;
  const routes=analysis?.routes?.length ? analysis.routes : batch.routes?.length ? batch.routes : (batch.routingStatus==="READY"?[{name:"Buyer Match",score:90,reason:"Gunakan Buyer Match untuk menghitung kecocokan demand aktif.",rule_version:"HASILTANI-R1.0"}]:[]);
  return <>
    {batch.analysisMode==="demo"&&<div className="alert alert-warning"><CircleAlert size={16} style={{verticalAlign:"-3px",marginRight:7}}/><strong>Mode demo lokal:</strong> batch ini menyimpan hasil fallback demo, bukan prediksi model final.</div>}
    {batch.routingStatus==="REVIEW"&&<div className="alert alert-warning"><CircleAlert size={16} style={{verticalAlign:"-3px",marginRight:7}}/>Routing otomatis ditahan. Ambil ulang foto jika ingin melanjutkan ke buyer match.</div>}
    <div className="detail-grid">
      <section className="dash-panel"><div className="detail-cover"><Image src={resolveBatchCover(batch.commodity, batch.coverImage)} alt={commodityLabel[batch.commodity]} width={900} height={560}/></div><div className="detail-cards"><div className="detail-card"><small>Komoditas</small><strong>{commodityLabel[batch.commodity]}</strong></div><div className="detail-card"><small>Kondisi visual</small><strong>{batch.conditionLabel||"—"}</strong></div><div className="detail-card"><small>Berat</small><strong>{numberId(batch.weightKg,1)} kg</strong></div><div className="detail-card"><small>Tanggal panen</small><strong>{dateId(batch.harvestDate)}</strong></div></div></section>
      <aside className="dash-panel"><div className="panel-head"><h2>Hasil analisis</h2><span className={`status ${batch.routingStatus==="REVIEW"?"review":"ready"}`}>{batch.routingStatus}</span></div><div className="quick-card" style={{minHeight:160,padding:18}}><span>Confidence</span><strong>{Math.round((batch.confidence||0)*100)}%</strong><span>{analysis?.model_version || batch.modelVersion || "Metadata model belum tersedia"}</span></div><h3>Smart Destination</h3><div className="route-list">{routes.map(r=><div className="route-row" key={r.name}><div className="route-score">{r.score}</div><div><b>{r.name}</b><p>{r.reason}</p></div></div>)}</div><div style={{display:"grid",gap:8,marginTop:18}}>{batch.routingStatus==="READY"&&<Link href={`/petani/match?batch=${batch.id}`} className="btn btn-primary btn-block">Cari Buyer Match <ArrowRight size={17}/></Link>}<Link href="/petani/batch/baru" className="btn btn-ghost btn-block">Analisis Batch Baru</Link></div></aside>
    </div>
  </>;
}
