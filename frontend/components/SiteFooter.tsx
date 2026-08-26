import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { ScanAccessLink } from "@/components/ScanAccessLink";

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer-foundation">
      <div className="container footer-main">
        <div className="footer-brand-foundation">
          <Link
            href="/"
            className="footer-brand-lockup-brand"
            aria-label="HASILTANI beranda"
          >
            <span className="footer-mark-brand">
              <Image src="/brand/identity-mascot.png" alt="" width={64} height={64} />
            </span>

            <span className="footer-wordmark-brand">
              <Image
                src="/brand/identity-wordmark.png"
                alt="HASILTANI"
                width={300}
                height={100}
              />
            </span>
          </Link>

          <h2>
            Setiap Panen Punya Jalur.
            <br />
            Setiap Hasil Punya Nilai.
          </h2>

          <p>
            Kelola, pantau, dan salurkan hasil tani dengan lebih mudah melalui satu
            platform terintegrasi.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <span>Jelajahi</span>
            <Link href="/">Beranda</Link>
            <Link href="/#komoditas">Komoditas</Link>
            <Link href="/#cara-kerja">Cara Kerja</Link>
            <Link href="/#jalur">Jalur Hasil</Link>
            <Link href="/#tentang">Tentang</Link>
          </div>

          <div>
            <span>Aksi</span>
            <ScanAccessLink>
              Analisis Hasil
              <ScanLine size={15} />
            </ScanAccessLink>

            <Link href="/login">
              Masuk
              <ArrowUpRight size={15} />
            </Link>

            <Link href="/daftar">
              Daftar
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="container footer-bottom-foundation footer-bottom-about">
        <span>© 2026 HASILTANI</span>
      </div>
    </footer>
  );
}
