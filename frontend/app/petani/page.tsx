"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, GitMerge, HandCoins, ScanLine, ShoppingBasket } from "lucide-react";
import { useDemoDb, useSessionUser } from "@/lib/hooks";
import { commodityLabel, dateId, numberId, rupiah } from "@/lib/format";
import { resolveBatchCover } from "@/lib/commodity-images";

export default function PetaniDashboard(){
  const db=useDemoDb(); const user=useSessionUser();
  if(!db||!user) return null;
  const batches=db.batches.filter(b=>b.farmerId===user.id);
  const total=batches.reduce((s,b)=>s+b.weightKg,0);
  const matched=batches.filter(b=>["matched","pooled","offered"].includes(b.status)).reduce((s,b)=>s+b.weightKg,0);
  const pendingOffers=db.offers.filter(o=>o.sellerId===user.id&&o.status==="pending");
  return <>
    <div className="dash-hero">
      <section className="welcome-card"><span className="eyebrow" style={{color:"#f5bb4d"}}>Petani workspace</span><h2>Panen hari ini punya langkah berikutnya.</h2><p>Buat batch, analisis kondisi visual, lalu lanjutkan ke jalur, buyer match, pool, dan offer tanpa kembali ke awal.</p><Link href="/petani/batch/baru" className="btn btn-orange"><ScanLine size={17}/> Buat & Scan Batch</Link></section>
      <aside className="quick-card"><span>Volume batch aktif</span><strong>{numberId(total)} kg</strong><span>{batches.length} batch tersimpan · {numberId(matched)} kg sudah masuk fase match/pool.</span></aside>
    </div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-card-head"><span>Batch aktif</span><span className="stat-icon"><Boxes size={18}/></span></div><strong>{batches.length}</strong><small>Semua komoditas</small></div>
      <div className="stat-card"><div className="stat-card-head"><span>Buyer match</span><span className="stat-icon"><ShoppingBasket size={18}/></span></div><strong>{batches.filter(b=>b.status==="matched").length}</strong><small>Siap dilanjutkan</small></div>
      <div className="stat-card"><div className="stat-card-head"><span>Harvest Pool</span><span className="stat-icon"><GitMerge size={18}/></span></div><strong>{db.pools.filter(p=>p.memberBatchIds.some(id=>batches.some(b=>b.id===id))).length}</strong><small>Pool terkait batchmu</small></div>
      <div className="stat-card"><div className="stat-card-head"><span>Offer menunggu</span><span className="stat-icon"><HandCoins size={18}/></span></div><strong>{pendingOffers.length}</strong><small>Butuh respons buyer</small></div>
    </div>
    <div className="dash-grid">
      <section className="dash-panel"><div className="panel-head"><h2>Batch terbaru</h2><Link href="/petani/batch/baru">Tambah batch</Link></div><div className="table-wrap"><table><thead><tr><th>Batch</th><th>Kondisi</th><th>Berat</th><th>Panen</th><th>Status</th></tr></thead><tbody>{batches.map(b=><tr key={b.id}><td><Link className="table-primary" href={`/petani/batch/${b.id}`}><Image className="table-thumb" src={resolveBatchCover(b.commodity, b.coverImage)} alt="" width={46} height={46}/><div><b>{commodityLabel[b.commodity]}</b><small className="muted">{b.location}</small></div></Link></td><td>{b.conditionLabel||"Belum dianalisis"}</td><td>{numberId(b.weightKg,1)} kg</td><td>{dateId(b.harvestDate)}</td><td><span className={`status ${b.routingStatus==="REVIEW"?"review":b.status==="matched"?"active":"ready"}`}>{b.status}</span></td></tr>)}</tbody></table></div></section>
      <aside className="dash-panel"><div className="panel-head"><h2>Offer terbaru</h2><Link href="/petani/offer">Lihat semua</Link></div><div className="list-stack">{db.offers.filter(o=>o.sellerId===user.id).slice(0,4).map(o=><div className="list-item" key={o.id}><div className="list-item-main"><b>{o.buyerName}</b><small>{numberId(o.acceptedWeightKg)} kg · {rupiah(o.offeredPricePerKg)}/kg</small></div><span className={`status ${o.status}`}>{o.status}</span></div>)}</div></aside>
    </div>
  </>;
}
