"use client";

import { Check, Clock3, Mail, MapPin, ShieldCheck, X } from "lucide-react";
import { updateDemoVerification } from "@/lib/demo-db";
import { useDemoDb } from "@/lib/hooks";
import type { SessionUser } from "@/lib/types";

export default function VerificationPage() {
  const db = useDemoDb();
  if (!db) return null;

  const rows = db.users
    .filter((user) => user.role !== "admin")
    .sort((a, b) => {
      const order = { pending: 0, verified: 1, rejected: 2 } as const;
      return order[a.verificationStatus] - order[b.verificationStatus];
    });

  const pendingCount = rows.filter((user) => user.verificationStatus === "pending").length;

  async function update(user: SessionUser, status: SessionUser["verificationStatus"]) {
    await updateDemoVerification(user.id, status);
  }

  return (
    <section className="dash-panel verification-panel">
      <div className="panel-head verification-head">
        <div>
          <span className="verification-kicker">Verifikasi akun</span>
          <h2>Pengguna terdaftar</h2>
          <p className="muted">
            Akun Petani dan Buyer baru masuk ke sini dengan status pending sebelum dapat login.
          </p>
        </div>
        <div className="verification-count">
          <Clock3 size={16} />
          <strong>{pendingCount}</strong>
          <span>menunggu</span>
        </div>
      </div>

      {rows.length ? (
        <div className="verification-list">
          {rows.map((user) => {
            const location = (user as SessionUser & { location?: string }).location;
            return (
              <article className="verification-card" key={user.id}>
                <div className="verification-avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="verification-user">
                  <div className="verification-name">
                    <strong>{user.name}</strong>
                    <span className={`status ${user.verificationStatus}`}>{user.verificationStatus}</span>
                  </div>
                  <span className="verification-role">
                    {user.role === "buyer" ? "Buyer / Pengolah" : "Petani"}
                  </span>
                  <div className="verification-meta">
                    <span><Mail size={13} /> {user.email || "Email tidak tersedia"}</span>
                    <span><ShieldCheck size={13} /> {user.organization || "Tanpa organisasi"}</span>
                    {location && <span><MapPin size={13} /> {location}</span>}
                  </div>
                </div>

                <div className="verification-actions">
                  {user.verificationStatus === "pending" ? (
                    <>
                      <button className="btn btn-soft btn-small" onClick={() => update(user, "verified")}>
                        <Check size={15} /> Verifikasi
                      </button>
                      <button className="btn btn-danger btn-small" onClick={() => update(user, "rejected")}>
                        <X size={15} /> Tolak
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => update(user, "pending")}
                    >
                      Tinjau ulang
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">Belum ada akun Petani atau Buyer yang terdaftar.</div>
      )}
    </section>
  );
}
