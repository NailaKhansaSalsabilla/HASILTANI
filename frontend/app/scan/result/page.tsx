"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleAlert, Leaf, LogIn, RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { AnalysisResult, ConditionOption, SessionUser } from "@/lib/types";
import { currentSession } from "@/lib/session";
import { rupiah } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";


type ConditionValue = {
  offerPrice: number;
  offerLabel: string;
  buyerLabel: string;
  routeLabel: string;
  note: string;
};

const CONDITION_VALUES: Record<AnalysisResult["commodity"], Record<string, ConditionValue>> = {
  pisang: {
    unripe: { offerPrice: 8500, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Pengolah keripik / tepung", routeLabel: "Keripik · Tepung · Pematangan", note: "Nilai simulasi untuk kondisi belum matang; offer nyata mengikuti demand buyer." },
    ripe: { offerPrice: 14500, offerLabel: "Offer fresh buyer — Demo/Simulasi", buyerLabel: "Fresh market / retail", routeLabel: "Fresh · Retail · Horeca", note: "Didekatkan ke benchmark fresh; transaksi nyata tetap berasal dari buyer." },
    overripe: { offerPrice: 6500, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Bakery / smoothie / puree", routeLabel: "Bakery · Smoothie · Puree", note: "Untuk terlalu matang yang masih layak visual setelah verifikasi." },
    rotten: { offerPrice: 500, offerLabel: "Offer non-pangan — Demo/Simulasi", buyerLabel: "Pengolah bahan organik", routeLabel: "Kompos / bahan organik", note: "Harga simulasi bahan organik. Pakan ternak hanya kandidat setelah verifikasi kelayakan." },
  },
  tomat: {
    unripe: { offerPrice: 7500, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Pengolah / pematangan", routeLabel: "Pematangan · Pengolah", note: "Nilai simulasi untuk tomat belum matang." },
    ripe: { offerPrice: 12300, offerLabel: "Offer fresh buyer — Demo/Simulasi", buyerLabel: "Fresh market / horeca", routeLabel: "Fresh · Restaurant · Catering", note: "Didekatkan ke benchmark pasar fresh; offer nyata mengikuti buyer." },
    overripe: { offerPrice: 6000, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Saus / sambal / puree", routeLabel: "Saus · Sambal · Puree", note: "Untuk tomat terlalu matang yang belum dikonfirmasi rusak/busuk berat." },
    rotten: { offerPrice: 500, offerLabel: "Offer non-pangan — Demo/Simulasi", buyerLabel: "Pengolah bahan organik", routeLabel: "Kompos / bahan organik", note: "Harga simulasi bahan organik; jalur pangan ditahan." },
  },
  mangga: {
    unripe: { offerPrice: 15000, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Asinan / pickle / pengolah", routeLabel: "Asinan · Pematangan · Pengolah", note: "Nilai simulasi untuk mangga belum matang." },
    ripe: { offerPrice: 25500, offerLabel: "Offer fresh buyer — Demo/Simulasi", buyerLabel: "Fresh market / retail", routeLabel: "Fresh · Retail · Horeca", note: "Didekatkan ke benchmark fresh; transaksi nyata tetap berasal dari buyer." },
    overripe: { offerPrice: 10000, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Juice / puree / selai", routeLabel: "Juice · Puree · Selai", note: "Hanya untuk terlalu matang yang dikonfirmasi masih layak visual." },
    rotten: { offerPrice: 500, offerLabel: "Offer non-pangan — Demo/Simulasi", buyerLabel: "Pengolah bahan organik", routeLabel: "Kompos / bahan organik", note: "Harga simulasi bahan organik; pakan ternak perlu verifikasi penerima." },
  },
  jeruk: {
    unripe: { offerPrice: 10000, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Pengolah / sortasi lanjut", routeLabel: "Pengolah · Sortasi lanjut", note: "Nilai simulasi untuk jeruk belum matang." },
    ripe: { offerPrice: 15000, offerLabel: "Offer fresh buyer — Demo/Simulasi", buyerLabel: "Fresh market / juice", routeLabel: "Fresh · Retail · Juice", note: "Didekatkan ke harga pasar lokal Lampung yang tersedia sebagai referensi; offer nyata mengikuti buyer." },
    overripe: { offerPrice: 7500, offerLabel: "Offer pengolah — Demo/Simulasi", buyerLabel: "Juice / processing", routeLabel: "Juice · Processing", note: "Hanya untuk terlalu matang yang dikonfirmasi masih layak visual." },
    rotten: { offerPrice: 500, offerLabel: "Offer non-pangan — Demo/Simulasi", buyerLabel: "Pengolah bahan organik", routeLabel: "Kompos / bahan organik", note: "Harga simulasi bahan organik; jalur pangan ditahan." },
  },
};

function damageRawClass(_commodity: AnalysisResult["commodity"]) {
  return "rotten";
}

function valueFor(result: AnalysisResult): ConditionValue | null {
  const key = result.routing_status === "RESTRICTED" ? damageRawClass(result.commodity) : (result.raw_class ?? "");
  return CONDITION_VALUES[result.commodity]?.[key] ?? null;
}


type AiAdviceMode = "strong" | "advisory" | "none";

type AiAdvice = {
  mode: AiAdviceMode;
  title: string;
  detail: string;
};

function aiAdvicePolicy(result: AnalysisResult): AiAdvice {
  const confidence = result.confidence;
  const predicted = result.raw_class ?? "";

  // Rotten is now a real AI candidate for ALL four commodities through the shared
  // spoilage guard. Because it affects food/non-food routing, it stays advisory
  // until a human confirms it.
  if (predicted === "rotten") {
    return {
      mode: "advisory",
      title: `Indikasi AI: ${result.condition_label ?? "Rusak / Busuk Berat"} (${Math.round(confidence * 100)}%)`,
      detail: "Spoilage guard melihat ciri kerusakan/busuk. Konfirmasi manusia tetap wajib sebelum jalur pangan ditahan.",
    };
  }

  if (confidence >= 0.75) {
    return {
      mode: "strong",
      title: `Saran AI: ${result.condition_label ?? "Kondisi"} (${Math.round(confidence * 100)}%)`,
      detail: "Saran ini merupakan kandidat awal dari foto. Keputusan jalur tetap mengikuti kondisi yang Anda konfirmasi.",
    };
  }

  return {
    mode: "none",
    title: `Kandidat AI: ${result.condition_label ?? "Perlu Verifikasi"} (${Math.round(confidence * 100)}%)`,
    detail: "Confidence/consensus belum cukup kuat untuk routing otomatis. Pilih kondisi berdasarkan tampilan nyata atau ambil foto ulang.",
  };
}

export default function ScanResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [conditionConfirmed, setConditionConfirmed] = useState(false);
  const [decisionVerified, setDecisionVerified] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("hasiltani:last-analysis");
    if (raw) setResult(JSON.parse(raw));
    setPhoto(sessionStorage.getItem("hasiltani:last-photo"));
    currentSession().then(setUser);
  }, []);

  const saveDecision = (next: AnalysisResult) => {
    setResult(next);
    sessionStorage.setItem("hasiltani:last-analysis", JSON.stringify(next));
  };



  const markRestricted = () => {
    if (!result) return;
    setConditionConfirmed(true);
    setDecisionVerified(true);
    saveDecision({
      ...result,
      raw_class: damageRawClass(result.commodity),
      condition_label: "Rusak / Busuk Berat",
      routing_status: "RESTRICTED",
      review_reason: null,
      requires_visual_confirmation: false,
      routes: result.restricted_routes ?? [],
      message: "Kerusakan/busuk berat dikonfirmasi pengguna. Jalur pangan ditahan dan HASILTANI memprioritaskan kandidat non-pangan. Pakan ternak tetap memerlukan verifikasi kelayakan penerima.",
    });
  };

  const applyConditionOption = (option: ConditionOption) => {
    if (!result) return;
    setConditionConfirmed(true);
    setDecisionVerified(true);

    const nextStatus = option.restricted ? "RESTRICTED" : "READY";
    saveDecision({
      ...result,
      raw_class: option.raw_class,
      condition_label: option.label,
      routing_status: nextStatus,
      review_reason: null,
      requires_visual_confirmation: false,
      routes: option.restricted ? (result.restricted_routes ?? option.routes) : option.routes,
      candidate_routes: option.routes,
      message: option.restricted
        ? "Kondisi rusak/busuk berat dikonfirmasi pengguna. Jalur pangan ditahan dan HASILTANI mengarahkan batch ke kandidat non-pangan."
        : `Kondisi ${option.label.toLowerCase()} dikonfirmasi pengguna. Smart Destination diperbarui berdasarkan aturan komoditas dan kondisi tersebut.`,
    });
  };

  if (!result) {
    return <><SiteHeader /><main className="container result-shell"><div className="empty-state"><h2>Belum ada hasil analisis.</h2><p>Lakukan scan terlebih dahulu.</p><Link href="/scan" className="btn btn-primary">Mulai Scan</Link></div></main></>;
  }

  const confidence = Math.round(result.confidence * 100);
  const isRestricted = decisionVerified && result.routing_status === "RESTRICTED";
  const effectiveStatus = decisionVerified ? result.routing_status : "REVIEW";
  const statusClass = effectiveStatus === "READY" ? "ready" : effectiveStatus === "RESTRICTED" ? "restricted" : "review";
  const conditionOptions = result.condition_options ?? [];
  const damageKey = damageRawClass(result.commodity);
  const hasDamageOption = conditionOptions.some((option) => option.restricted || option.raw_class === damageKey);
  const optionsWithDamage: ConditionOption[] = hasDamageOption
    ? conditionOptions
    : [
        ...conditionOptions,
        {
          raw_class: damageKey,
          label: "Rusak / Busuk Berat",
          restricted: true,
          routes: result.restricted_routes ?? [],
        },
      ];
  const aiAdvice = aiAdvicePolicy(result);
  const orderedOptions = [...optionsWithDamage].sort((a, b) => {
    // Hanya saran AI yang benar-benar kuat yang ditempatkan paling awal.
    // Pada mode advisory/none, jangan bias pengguna ke prediksi model.
    if (aiAdvice.mode === "strong") {
      if (a.raw_class === result.raw_class) return -1;
      if (b.raw_class === result.raw_class) return 1;
    }
    if (a.restricted && !b.restricted) return 1;
    if (!a.restricted && b.restricted) return -1;
    return 0;
  });
  const conditionValue = decisionVerified ? valueFor(result) : null;

  // Show the AI candidate clearly even before human verification. REVIEW means
  // "do not auto-route", not "AI produced no prediction".
  const displayCondition = result.condition_label ?? "Perlu Verifikasi";

  const nextBatch = "/petani/batch/baru?reuse=1";
  const continueHref = user?.role === "petani" ? nextBatch : `/login?next=${encodeURIComponent(nextBatch)}`;

  return (
    <>
      <SiteHeader />
      <main className="container result-shell">
        {result.mode === "demo" && <div className="alert alert-warning"><CircleAlert size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} /><strong>Mode demo lokal:</strong> hasil kondisi bukan prediksi model final.</div>}

        <div className="result-top">
          <section className="result-main">
            <span className="result-kicker">{result.commodity_label} · {effectiveStatus}</span>
            <div className="result-condition">{displayCondition}</div>
            <div className="confidence"><strong>{confidence}%</strong><span>keyakinan prediksi AI</span></div>
            {!decisionVerified && (
              <div className="analysis-note">
                <b>{aiAdvice.title}</b><br />
                <span>{aiAdvice.detail}</span>
              </div>
            )}
            <p style={{ maxWidth: 680, color: "#c0cec4", lineHeight: 1.65, position: "relative", zIndex: 2 }}>
              {decisionVerified
                ? result.message
                : "AI sudah menghasilkan kandidat kondisi dari foto. Jika status masih REVIEW, artinya hasil belum boleh dirouting otomatis — bukan berarti AI gagal mendeteksi. Konfirmasi kondisi yang benar-benar terlihat agar jalur tidak melenceng."}
            </p>
          </section>

          <aside className="result-side">
            {result.heatmap_data_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.heatmap_data_url} alt="Visual explanation dari area yang memengaruhi prediksi model" />
            ) : photo?.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Foto hasil tani yang dianalisis" />
            ) : (
              <Image src={result.commodity === "tomat" ? "/samples/tomat.webp" : result.commodity === "pisang" ? "/samples/pisang.webp" : result.commodity === "mangga" ? "/samples/mangga.webp" : "/samples/jeruk.webp"} width={600} height={450} alt={result.commodity_label} />
            )}
            <div className="result-meta">
              <div className="meta-box"><small>Model</small><strong>{result.model_version}</strong></div>
              <div className="meta-box"><small>Routing gate</small><strong>{effectiveStatus}</strong></div>
            </div>
          </aside>
        </div>

        {!conditionConfirmed && orderedOptions.length > 0 && (
          <section className="visual-confirm-card">
            <div>
              <span className="eyebrow">Human verification</span>
              <h2>Konfirmasi kondisi sebelum menentukan jalur</h2>
              <p><b>{aiAdvice.title}.</b> {aiAdvice.detail} Pilih kondisi yang benar-benar terlihat pada hasil tani.</p>
            </div>
            <div className="visual-confirm-actions" style={{ flexWrap: "wrap" }}>
              {orderedOptions.map((option) => {
                const suggested = aiAdvice.mode === "strong" && option.raw_class === result.raw_class;
                return (
                  <button
                    key={option.raw_class}
                    className={option.restricted ? "btn btn-danger-soft" : suggested ? "btn btn-primary" : "btn btn-ghost"}
                    onClick={() => applyConditionOption(option)}
                  >
                    {option.restricted ? <ShieldAlert size={16}/> : <BadgeCheck size={16}/>} {option.label}{suggested ? " · Saran AI" : ""}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="result-grid">
          <section className="panel">
            <div className="panel-head"><h2>Smart Destination</h2><span className={`status ${statusClass}`}>{effectiveStatus}</span></div>
            {decisionVerified && result.routes.length ? (
              <div className="route-list">
                {result.routes.map((route) => <div className="route-row" key={route.name}><div className="route-score">{route.score}</div><div><b>{route.name}</b><p>{route.reason}</p></div></div>)}
              </div>
            ) : (
              <div className="empty-state"><CircleAlert /><h3>Menunggu verifikasi pengguna</h3><p>Pilih kondisi yang benar-benar terlihat pada panel verifikasi di atas. Smart Destination baru aktif setelah kondisi dikonfirmasi.</p></div>
            )}

            {decisionVerified && result.routing_status === "READY" && (
              <div className="manual-restrict-box">
                <div><b>Foto terlihat rusak/busuk setelah verifikasi?</b><p>Gunakan override ini untuk menahan jalur pangan.</p></div>
                <button className="btn btn-danger-soft" onClick={markRestricted}><ShieldAlert size={16}/> Tandai rusak berat</button>
              </div>
            )}
          </section>

          <aside className={`panel ${isRestricted ? "restricted-panel" : ""}`}>
            {!decisionVerified ? (
              <>
                <h2>Market & Value Layer</h2>
                <div className="empty-state"><CircleAlert/><h3>Menunggu verifikasi kondisi</h3><p>Nilai pasar, buyer match, dan jalur transaksi belum ditampilkan agar keputusan tidak mengikuti prediksi AI yang belum dikonfirmasi.</p></div>
              </>
            ) : isRestricted ? (
              <>
                <div className="panel-head"><h2>Jalur Nilai Alternatif</h2><Leaf size={20}/></div>
                <div className="alert alert-restricted"><strong>Jalur pangan ditahan.</strong> Harga fresh market tidak digunakan untuk status RESTRICTED.</div>
                <div className="list-stack">
                  <div className="list-item"><div className="list-item-main"><small>{conditionValue?.offerLabel ?? "Offer non-pangan — Demo/Simulasi"}</small><b>{rupiah(conditionValue?.offerPrice ?? 500)}/kg</b></div><Leaf size={20}/></div>
                  <div className="list-item"><div className="list-item-main"><small>Jalur utama</small><b>{conditionValue?.routeLabel ?? "Kompos / bahan organik"}</b></div></div>
                  <div className="list-item"><div className="list-item-main"><small>Calon penerima</small><b>{conditionValue?.buyerLabel ?? "Pengolah bahan organik"}</b></div></div>
                  <div className="list-item"><div className="list-item-main"><small>Potensi nilai batch</small><b>Berat batch × {rupiah(conditionValue?.offerPrice ?? 500)}/kg</b></div></div>
                  <div className="list-item"><div className="list-item-main"><small>Kandidat tambahan</small><b>Pakan ternak — setelah verifikasi kelayakan</b></div></div>
                </div>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>{conditionValue?.note ?? "Nilai ini adalah simulasi prototype, bukan harga pasar resmi hasil rusak."}</p>
              </>
            ) : (
              <>
                <h2>Market & Value Layer</h2>
                <div className="list-stack">
                  <div className="list-item"><div className="list-item-main"><small>{conditionValue?.offerLabel ?? "Offer kondisi — Demo/Simulasi"}</small><b>{conditionValue ? `${rupiah(conditionValue.offerPrice)}/kg` : "Belum tersedia"}</b></div><BadgeCheck size={20} /></div>
                  <div className="list-item"><div className="list-item-main"><small>Jalur nilai kondisi</small><b>{conditionValue?.routeLabel ?? "Mengikuti Smart Destination"}</b></div></div>
                  <div className="list-item"><div className="list-item-main"><small>Calon buyer/pengolah</small><b>{conditionValue?.buyerLabel ?? "Masuk setelah demand match"}</b></div></div>
                  <div className="list-item"><div className="list-item-main"><small>Harga acuan fresh market</small><b>{result.reference_price > 0 ? `${rupiah(result.reference_price)}/kg` : "Belum tersedia"}</b></div></div>
                  <div className="list-item"><div className="list-item-main"><small>Potensi nilai batch</small><b>{conditionValue ? `Berat batch × ${rupiah(conditionValue.offerPrice)}/kg` : "Berat batch × offer buyer"}</b></div></div>
                </div>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>{conditionValue?.note ?? "Offer kondisi adalah data demo/simulasi untuk prototype. Harga acuan fresh bukan harga AI dan transaksi aktual tetap berasal dari buyer."}</p>
              </>
            )}

            <div style={{ display: "grid", gap: 9, marginTop: 20 }}>
              {decisionVerified && <Link href={continueHref} className="btn btn-primary btn-block">{user?.role === "petani" ? (isRestricted ? "Simpan sebagai Batch Restricted" : "Lanjutkan sebagai Batch") : <><LogIn size={17} /> Masuk untuk lanjut</>} <ArrowRight size={17} /></Link>}
              <Link href="/scan" className="btn btn-ghost btn-block"><RotateCcw size={17} /> Analisis Foto Lain</Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
