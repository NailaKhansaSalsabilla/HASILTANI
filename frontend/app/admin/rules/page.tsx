"use client";

import { toggleDemoRule } from "@/lib/demo-db";
import { useDemoDb } from "@/lib/hooks";
import { commodityLabel } from "@/lib/format";

export default function RulesPage(){const db=useDemoDb();if(!db)return null;return <><div className="alert alert-success"><strong>Rule version HASILTANI-R2.0.</strong> Routing dipisahkan dari model AI agar perubahan jalur dapat diaudit tanpa retraining model.</div><section className="dash-panel"><div className="panel-head"><h2>Routing rules</h2><span className="muted">Toggle mengubah state rule pada local demo.</span></div><div className="rule-grid">{db.rules.map(r=><article className="rule-card" key={r.id}><div className="rule-card-top"><div><b>{commodityLabel[r.commodity]} · {r.condition}</b><div className="muted">{r.destination} · score {r.score}</div></div><button className={`switch ${r.active?"on":""}`} onClick={()=>toggleDemoRule(r.id)} aria-label={r.active?"Nonaktifkan rule":"Aktifkan rule"}><span/></button></div><p>{r.reason}</p><span className={`status ${r.active?"ready":"review"}`}>{r.active?"active":"inactive"}</span></article>)}</div></section></>}
