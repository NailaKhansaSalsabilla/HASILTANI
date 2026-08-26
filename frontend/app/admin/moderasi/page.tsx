"use client";

import { CheckCircle2 } from "lucide-react";
import { resolveDemoFlag } from "@/lib/demo-db";
import { useDemoDb } from "@/lib/hooks";
import { dateId } from "@/lib/format";

export default function ModerationPage(){const db=useDemoDb();if(!db)return null;return <section className="dash-panel"><div className="panel-head"><div><h2>Moderation queue</h2><span className="muted">Flag dapat berasal dari demand, foto, atau aktivitas yang perlu ditinjau.</span></div></div><div className="list-stack">{db.moderation.map(f=><div className="list-item" key={f.id}><div className="list-item-main"><b>{f.targetType}</b><small>{f.reason} · {dateId(f.createdAt)}</small></div>{f.status==="open"?<button className="btn btn-soft btn-small" onClick={()=>resolveDemoFlag(f.id)}><CheckCircle2 size={15}/> Selesaikan</button>:<span className="status verified">resolved</span>}</div>)}</div></section>}
