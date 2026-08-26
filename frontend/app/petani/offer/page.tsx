"use client";

import { useDemoDb, useSessionUser } from "@/lib/hooks";
import { dateId, numberId, rupiah } from "@/lib/format";

export default function PetaniOfferPage(){const db=useDemoDb();const user=useSessionUser();if(!db||!user)return null;const rows=db.offers.filter(o=>o.sellerId===user.id);return <section className="dash-panel"><div className="panel-head"><h2>Offer yang dikirim</h2><span className="muted">Status berubah ketika buyer menerima atau menolak.</span></div>{rows.length?<div className="table-wrap"><table><thead><tr><th>Buyer</th><th>Volume</th><th>Harga offer</th><th>Nilai potensial</th><th>Tanggal</th><th>Status</th></tr></thead><tbody>{rows.map(o=><tr key={o.id}><td><b>{o.buyerName}</b></td><td>{numberId(o.acceptedWeightKg)} kg</td><td>{rupiah(o.offeredPricePerKg)}/kg</td><td>{rupiah(o.offeredPricePerKg*o.acceptedWeightKg)}</td><td>{dateId(o.createdAt)}</td><td><span className={`status ${o.status}`}>{o.status}</span></td></tr>)}</tbody></table></div>:<div className="empty-state">Belum ada offer.</div>}</section>}
