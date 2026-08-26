import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Leaf,
  Route,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ScanAccessLink } from "@/components/ScanAccessLink";

type Condition = {
  name: string;
  source: "AI" | "Verifikasi";
  route: "A" | "B" | "C";
  destination: string;
  value: string;
  note: string;
  restricted?: boolean;
};

type Commodity = {
  slug: string;
  name: string;
  scientific: string;
  image: string;
  category: string;
  unit: string;
  model: string;
  aiClasses: string;
  summary: string;
  primaryValue: string;
  primaryLabel: string;
  conditions: Condition[];
};

const COMMODITIES: Record<string, Commodity> = {
  pisang: {
    slug: "pisang",
    name: "Pisang",
    scientific: "Musa spp.",
    image: "/commodities/pisang.jpg",
    category: "Hortikultura",
    unit: "kg",
    model: "MobileNetV3-Small",
    aiClasses: "4 kondisi visual: belum matang, matang, terlalu matang, rusak/busuk",
    summary:
      "Pisang dianalisis untuk membedakan kondisi belum matang, matang, terlalu matang, dan rusak berat sebelum diteruskan ke Smart Destination.",
    primaryValue: "Rp14.500",
    primaryLabel: "Demo kondisi matang",
    conditions: [
      {
        name: "Belum Matang",
        source: "AI",
        route: "B",
        destination: "Pengolahan / pematangan lanjutan",
        value: "Rp8.500/kg",
        note: "Cocok untuk keripik, tepung, atau proses pematangan lanjutan.",
      },
      {
        name: "Matang",
        source: "AI",
        route: "A",
        destination: "Fresh Market",
        value: "Rp14.500/kg",
        note: "Prioritas ke pasar segar, retail, horeca, atau buyer fresh.",
      },
      {
        name: "Terlalu Matang",
        source: "AI",
        route: "B",
        destination: "Puree / olahan",
        value: "Rp6.500/kg",
        note: "Diarahkan ke pengolahan ketika tidak lagi ideal untuk fresh market.",
      },
      {
        name: "Rusak / Busuk Berat",
        source: "AI",
        route: "C",
        destination: "Kompos / non-pangan",
        value: "Rp500/kg",
        note: "Tidak diarahkan otomatis ke pangan. Pakan hanya setelah verifikasi sesuai kebutuhan.",
        restricted: true,
      },
    ],
  },
  tomat: {
    slug: "tomat",
    name: "Tomat",
    scientific: "Solanum lycopersicum",
    image: "/commodities/tomat.jpg",
    category: "Hortikultura",
    unit: "kg",
    model: "MobileNetV3-Small",
    aiClasses: "4 kondisi visual: belum matang, matang, terlalu matang, rusak/busuk",
    summary:
      "Tomat dianalisis dalam empat kondisi visual agar hasil yang masih bernilai tidak berhenti pada satu label, tetapi langsung memiliki jalur berikutnya.",
    primaryValue: "Rp12.300",
    primaryLabel: "Demo kondisi matang",
    conditions: [
      {
        name: "Belum Matang",
        source: "AI",
        route: "B",
        destination: "Pematangan lanjutan / pengolahan",
        value: "Rp7.500/kg",
        note: "Dapat dipertahankan untuk pematangan atau disesuaikan dengan kebutuhan pengolah.",
      },
      {
        name: "Matang",
        source: "AI",
        route: "A",
        destination: "Fresh Market",
        value: "Rp12.300/kg",
        note: "Diprioritaskan ke buyer fresh, retail, pasar, dan horeca.",
      },
      {
        name: "Terlalu Matang",
        source: "AI",
        route: "B",
        destination: "Saus / sambal / puree",
        value: "Rp6.000/kg",
        note: "Masih dapat diarahkan ke pengolahan bila terlalu matang tetapi belum rusak/busuk berat.",
      },
      {
        name: "Rusak / Busuk Berat",
        source: "AI",
        route: "C",
        destination: "Kompos / nilai alternatif",
        value: "Rp500/kg",
        note: "Jalur pangan ditahan setelah indikasi kerusakan/busuk dikonfirmasi pengguna.",
        restricted: true,
      },
    ],
  },
  mangga: {
    slug: "mangga",
    name: "Mangga",
    scientific: "Mangifera indica",
    image: "/commodities/mangga.jpg",
    category: "Hortikultura",
    unit: "kg",
    model: "MobileNetV3-Small",
    aiClasses: "4 kondisi visual: ripeness + spoilage guard",
    summary:
      "Mangga dianalisis dengan model tahap kematangan dan spoilage guard terpisah. Hasil akhir tetap berada pada empat kondisi yang sama dan harus dikonfirmasi pengguna.",
    primaryValue: "Rp25.500",
    primaryLabel: "Demo kondisi matang",
    conditions: [
      {
        name: "Belum Matang",
        source: "AI",
        route: "B",
        destination: "Pematangan / pengolahan",
        value: "Rp15.000/kg",
        note: "Dapat diarahkan ke pematangan lanjutan atau kebutuhan pengolah tertentu.",
      },
      {
        name: "Matang",
        source: "AI",
        route: "A",
        destination: "Fresh Market",
        value: "Rp25.500/kg",
        note: "Menjadi kandidat utama untuk pasar segar, retail, dan horeca.",
      },
      {
        name: "Terlalu Matang",
        source: "AI",
        route: "B",
        destination: "Juice / puree / selai",
        value: "Rp10.000/kg",
        note: "Masih memiliki nilai untuk produk olahan ketika tidak ideal untuk fresh market.",
      },
      {
        name: "Rusak / Busuk Berat",
        source: "AI",
        route: "C",
        destination: "Kompos / non-pangan",
        value: "Rp500/kg",
        note: "Spoilage guard dapat memberi indikasi rusak/busuk, tetapi pengguna tetap wajib mengonfirmasi sebelum jalur pangan ditahan.",
        restricted: true,
      },
    ],
  },
  jeruk: {
    slug: "jeruk",
    name: "Jeruk",
    scientific: "Citrus spp.",
    image: "/commodities/jeruk.jpg",
    category: "Hortikultura",
    unit: "kg",
    model: "MobileNetV3-Small",
    aiClasses: "4 kondisi visual: ripeness + spoilage guard",
    summary:
      "Jeruk dianalisis dengan model tahap kematangan dan spoilage guard terpisah. Hasil akhir tetap berada pada empat kondisi yang sama dan harus dikonfirmasi pengguna.",
    primaryValue: "Rp15.000",
    primaryLabel: "Demo kondisi matang",
    conditions: [
      {
        name: "Belum Matang",
        source: "AI",
        route: "B",
        destination: "Pematangan / pengolahan",
        value: "Rp10.000/kg",
        note: "Dapat diarahkan ke kebutuhan pengolah atau menunggu kematangan lebih sesuai.",
      },
      {
        name: "Matang",
        source: "AI",
        route: "A",
        destination: "Fresh Market",
        value: "Rp15.000/kg",
        note: "Prioritas pada jalur fresh, retail, pasar, dan horeca.",
      },
      {
        name: "Terlalu Matang",
        source: "AI",
        route: "B",
        destination: "Juice / olahan",
        value: "Rp7.500/kg",
        note: "Dialihkan ke pengolahan untuk mempertahankan nilai pemanfaatannya.",
      },
      {
        name: "Rusak / Busuk Berat",
        source: "AI",
        route: "C",
        destination: "Kompos / non-pangan",
        value: "Rp500/kg",
        note: "Spoilage guard dapat memberi indikasi rusak/busuk, tetapi pengguna tetap wajib mengonfirmasi sebelum jalur pangan ditahan.",
        restricted: true,
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(COMMODITIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const commodity = COMMODITIES[slug];

  if (!commodity) return {};

  return {
    title: commodity.name,
    description: `Informasi komoditas ${commodity.name}, kondisi visual, Smart Destination, dan nilai demo di HASILTANI.`,
  };
}

export default async function CommodityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const commodity = COMMODITIES[slug];

  if (!commodity) notFound();

  return (
    <>
      <SiteHeader />

      <main className="commodity-detail">
        <section className="commodity-detail-hero">
          <div className="container">
            <Link href="/#komoditas" className="commodity-back">
              <ArrowLeft size={16} />
              Kembali ke Komoditas
            </Link>

            <div className="commodity-detail-grid">
              <div className="commodity-detail-photo">
                <Image
                  src={commodity.image}
                  alt={`${commodity.name} — komoditas HASILTANI`}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 44vw"
                />
                <span className="commodity-photo-badge">{commodity.category}</span>
              </div>

              <div className="commodity-detail-copy">
                <div className="commodity-detail-icon">
                  <Leaf size={22} />
                </div>
                <span className="commodity-detail-category">Komoditas HASILTANI</span>
                <h1>{commodity.name}</h1>
                <p className="commodity-scientific">{commodity.scientific}</p>
                <p className="commodity-summary">{commodity.summary}</p>

                <div className="commodity-detail-actions">
                  <ScanAccessLink href={`/scan?commodity=${commodity.slug}`} className="btn-primary-catalog">
                    <ScanLine size={18} />
                    Analisis {commodity.name}
                    <ArrowRight size={16} />
                  </ScanAccessLink>
                  <Link href="/#cara-kerja" className="btn-secondary">
                    Lihat Cara Kerja
                  </Link>
                </div>

                <div className="commodity-value">
                  <span>Nilai demo utama</span>
                  <strong>{commodity.primaryValue}</strong>
                  <small>per kg · {commodity.primaryLabel}</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="commodity-info-section">
          <div className="container commodity-info-layout">
            <article className="commodity-info-card">
              <div className="commodity-card-heading">
                <div>
                  <span>Informasi Komoditas</span>
                  <h2>Ringkasan sistem</h2>
                </div>
                <BrainCircuit size={24} />
              </div>

              <dl className="commodity-facts">
                <div>
                  <dt>Kategori</dt>
                  <dd>{commodity.category}</dd>
                </div>
                <div>
                  <dt>Satuan</dt>
                  <dd>{commodity.unit}</dd>
                </div>
                <div>
                  <dt>Model visual</dt>
                  <dd>{commodity.model}</dd>
                </div>
                <div>
                  <dt>Kondisi didukung</dt>
                  <dd>{commodity.aiClasses}</dd>
                </div>
                <div>
                  <dt>Input analisis</dt>
                  <dd>1–3 foto</dd>
                </div>
                <div>
                  <dt>Human Verification</dt>
                  <dd>Aktif</dd>
                </div>
              </dl>
            </article>

            <aside className="commodity-ai-card">
              <span className="commodity-ai-kicker">Hubungan dengan AI</span>
              <h2>AI membaca kondisi. Sistem menentukan jalurnya.</h2>
              <div className="commodity-ai-steps">
                <div>
                  <Camera size={18} />
                  <span>Foto hasil tani masuk ke analisis visual.</span>
                </div>
                <div>
                  <BrainCircuit size={18} />
                  <span>Model tahap kematangan + spoilage guard menghasilkan kandidat kondisi.</span>
                </div>
                <div>
                  <ShieldCheck size={18} />
                  <span>Pengguna mengonfirmasi kondisi sebelum keputusan akhir.</span>
                </div>
                <div>
                  <Route size={18} />
                  <span>Decision Engine mengarahkan hasil ke Jalur A, B, atau C.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="commodity-condition-section">
          <div className="container">
            <div className="commodity-condition-head">
              <div>
                <span>Kondisi & Smart Destination</span>
                <h2>Setiap kondisi punya jalur berikutnya.</h2>
              </div>
              <p>
                Nilai di bawah merupakan demo/simulasi untuk prototipe. Nilai aktual dapat
                diganti oleh harga acuan atau penawaran buyer ketika sumber datanya tersedia.
              </p>
            </div>

            <div className="commodity-condition-grid">
              {commodity.conditions.map((condition) => (
                <article
                  className={`condition-card ${condition.restricted ? "restricted" : ""}`}
                  key={condition.name}
                >
                  <div className="condition-top">
                    <span className={`condition-source source-${condition.source.toLowerCase()}`}>
                      {condition.source}
                    </span>
                    <span className={`condition-route route-${condition.route.toLowerCase()}`}>
                      Jalur {condition.route}
                    </span>
                  </div>

                  <h3>{condition.name}</h3>
                  <p>{condition.note}</p>

                  <div className="condition-destination">
                    <small>Smart Destination</small>
                    <strong>{condition.destination}</strong>
                  </div>

                  <div className="condition-value">
                    <span>Nilai demo</span>
                    <strong>{condition.value}</strong>
                  </div>

                  {condition.restricted && (
                    <div className="condition-restricted">
                      <ShieldCheck size={15} />
                      Perlu pembatasan / verifikasi sebelum jalur pangan.
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="commodity-detail-cta">
              <div>
                <CheckCircle2 size={24} />
                <span>
                  Siap melihat bagaimana foto {commodity.name.toLowerCase()} diterjemahkan
                  menjadi kondisi dan jalur nilai?
                </span>
              </div>
              <ScanAccessLink href={`/scan?commodity=${commodity.slug}`} className="btn-primary-catalog">
                Coba Analisis {commodity.name}
                <ArrowRight size={17} />
              </ScanAccessLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
