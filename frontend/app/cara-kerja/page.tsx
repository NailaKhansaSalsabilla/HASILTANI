import Link from "next/link";
import { ArrowRight, BrainCircuit, GitMerge, ScanLine, ShieldCheck, ShoppingBasket } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function CaraKerjaPage() {
  const steps = [
    [ScanLine, "1. Ambil 1–3 foto", "Kamera langsung atau galeri. User memilih Tomat, Pisang, Mangga, atau Jeruk sebelum analisis."],
    [BrainCircuit, "2. Analisis kondisi visual", "Model per komoditas mengeluarkan kelas yang memang ada pada dataset dan confidence. Guardrail operasional menahan hasil yang belum meyakinkan ke REVIEW."],
    [GitMerge, "3. Smart Route", "Rule engine transparan mengubah kondisi visual menjadi kandidat jalur. Ini bukan keputusan AI generatif dan bukan sertifikasi pangan."],
    [ShoppingBasket, "4. Demand Match", "Kecocokan buyer dihitung dari kondisi yang diterima, komoditas, volume, jarak, dan deadline. Harga offer berasal dari buyer."],
    [ShieldCheck, "5. Harvest Pool & offer", "Batch kompatibel dapat digabung untuk mengejar minimum volume. Setiap batch tetap punya identitas sendiri."],
  ] as const;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">Cara Kerja</span>
            <h1 className="display" style={{ maxWidth: 950 }}>Dari kondisi visual menuju jalur yang lebih jelas.</h1>
            <p className="lead">HASILTANI tidak mencampur semua keputusan ke dalam satu “AI”. Analisis visual, rule routing, benchmark pasar, buyer offer, matching, dan pooling memiliki tanggung jawab yang berbeda.</p>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="story-steps">
              {steps.map(([Icon, title, text], i) => (
                <article className="story-step" key={title}>
                  <div className="story-step-number"><Icon size={24} /></div>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </article>
              ))}
            </div>
            <div className="panel" style={{ marginTop: 28 }}>
              <h2>Batas klaim yang dikunci</h2>
              <p className="lead" style={{ fontSize: 17 }}>Foto tidak cukup untuk membuktikan keamanan pangan, kadar gula, penyakit, kandungan kimia, atau kualitas universal. HASILTANI hanya mengklasifikasikan kondisi visual sesuai label dataset dan meneruskan hasil tersebut ke decision layer yang transparan.</p>
              <Link href="/scan" className="btn btn-primary">Coba Scan <ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
