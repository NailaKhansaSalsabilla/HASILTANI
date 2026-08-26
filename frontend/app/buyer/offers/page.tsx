"use client";

import { Check, X } from "lucide-react";
import { updateDemoOffer } from "@/lib/demo-db";
import { useDemoDb, useSessionUser } from "@/lib/hooks";
import { dateId, numberId, rupiah } from "@/lib/format";

export default function BuyerOffers(){const db=useDemoDb();const user=useSessionUser();if(!db||!user)return null;const rows=db.offers.filter(o=>o.buyerId===user.id);return <section className="dash-panel"><div className="panel-head"><div><h2>Offer dari petani / pool</h2><span className="muted">Accept/Reject benar-benar mengubah state offer di local demo.</span></div></div>{rows.length?<div className="list-stack">{rows.map(o=><div className="list-item" key={o.id}><div className="list-item-main"><b>{numberId(o.acceptedWeightKg)} kg · {rupiah(o.offeredPricePerKg)}/kg</b><small>Nilai {rupiah(o.acceptedWeightKg*o.offeredPricePerKg)} · {dateId(o.createdAt)}</small></div><div className="list-actions">{o.status==="pending"?<><button className="btn btn-soft btn-small" onClick={()=>updateDemoOffer(o.id,"accepted")}><Check size={15}/> Terima</button><button className="btn btn-danger btn-small" onClick={()=>updateDemoOffer(o.id,"rejected")}><X size={15}/> Tolak</button></>:<span className={`status ${o.status}`}>{o.status}</span>}</div></div>)}</div>:<div className="empty-state">Belum ada offer masuk.</div>}</section>}
