"use client";

import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { matchDemand } from "@/lib/api";
import { commodityLabel, numberId, rupiah } from "@/lib/format";
import { useDemoDb, useSessionUser } from "@/lib/hooks";

type Row = {
  batchId: string;
  commodity: string;
  conditionLabel?: string;
  weight: number;
  score: number;
  potential: number;
  pool: boolean;
  buyer: string;
};

export default function BuyerMatches() {
  const db = useDemoDb();
  const user = useSessionUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const demands = useMemo(
    () =>
      db && user
        ? db.demands.filter(
            (d) => d.buyerId === user.id && d.status === "active",
          )
        : [],
    [db, user],
  );

  if (!db || !user) return null;

  const activeDb = db;

  async function refresh() {
    setLoading(true);

    try {
      const out: Row[] = [];
      const readyBatches = activeDb.batches.filter(
        (batch) => batch.routingStatus === "READY" && batch.condition,
      );

      for (const batch of readyBatches) {
        const result = await matchDemand({
          commodity: batch.commodity,
          condition: batch.condition!,
          volumeKg: batch.weightKg,
          demands,
        });

        for (const match of result.matches) {
          out.push({
            batchId: batch.id,
            commodity: commodityLabel[batch.commodity],
            conditionLabel: batch.conditionLabel,
            weight: batch.weightKg,
            score: match.score,
            potential: match.potential_value,
            pool: match.pool_recommended,
            buyer: match.buyer_name,
          });
        }
      }

      out.sort((a, b) => b.score - a.score);
      setRows(out);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="dash-panel">
        <div className="panel-head">
          <div>
            <h2>Demand-to-supply matches</h2>
            <span className="muted">
              Hitung ulang setelah demand atau batch berubah.
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={17} /> Menghitung…
              </>
            ) : (
              "Refresh Matches"
            )}
          </button>
        </div>

        {demands.length === 0 && (
          <div className="empty-state">Belum ada demand aktif.</div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="dash-panel" style={{ marginTop: 18 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Kondisi</th>
                  <th>Volume</th>
                  <th>Match</th>
                  <th>Potential</th>
                  <th>Pool</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.batchId}-${index}`}>
                    <td>
                      <b>{row.commodity}</b>
                      <small className="muted">
                        {" "}
                        {row.batchId.slice(0, 12)}
                      </small>
                    </td>
                    <td>{row.conditionLabel}</td>
                    <td>{numberId(row.weight)} kg</td>
                    <td>
                      <span className="status active">{row.score}%</span>
                    </td>
                    <td>{rupiah(row.potential)}</td>
                    <td>
                      {row.pool ? (
                        <span className="status pending">recommended</span>
                      ) : (
                        <span className="status ready">volume fit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
