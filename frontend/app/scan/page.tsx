"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { SiteHeader } from "@/components/SiteHeader";
import { currentSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

export default function ScanPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const resolveAccess = async () => {
      const session = await currentSession();
      if (!active) return;

      setUser(session);

      if (session?.role === "buyer" || session?.role === "admin") {
        router.replace(`/${session.role}`);
      }
    };

    void resolveAccess();

    return () => {
      active = false;
    };
  }, [router]);

  const restricted = user?.role === "buyer" || user?.role === "admin";

  if (user === undefined || restricted) {
    return (
      <>
        <SiteHeader />
        <main className="scan-access-loading">
          <LoaderCircle size={25} className="scan-access-spinner" />
          <span>Menyiapkan akses HASILTANI…</span>
        </main>
      </>
    );
  }

  const isFarmer = user?.role === "petani";

  return (
    <>
      <SiteHeader />

      <main className="scan-page">
        <div className="scan-shell">
          <aside className="scan-aside">
            <span className="scan-aside-kicker">
              {isFarmer ? "ANALISIS HASIL TANI" : "SCAN TANPA LOGIN"}
            </span>

            <h1>
              {isFarmer
                ? "Cek kondisi sebelum menentukan jalur."
                : "Kenali kondisi. Temukan jalur berikutnya."}
            </h1>

            <p>
              {isFarmer
                ? "Ambil 1–3 foto dari hasil tani yang akan dianalisis. AI memberi prediksi kondisi awal, lalu Anda dapat mengonfirmasi hasil sebelum melihat Smart Destination dan nilai potensial."
                : "Pilih komoditas, ambil 1–3 foto melalui kamera atau galeri, lalu lihat prediksi kondisi. Hasil tetap dapat dikonfirmasi sebelum Smart Destination menampilkan jalur dan nilai potensial."}
            </p>

            <div className="scan-aside-pill">
              {isFarmer ? "AI + verifikasi pengguna" : "Kamera / galeri • tanpa akun"}
            </div>

            <div className="scan-aside-steps" aria-label="Alur analisis">
              <span><b>01</b> Pilih komoditas</span>
              <span><b>02</b> Ambil foto</span>
              <span><b>03</b> Analisis kondisi</span>
              <span><b>04</b> Verifikasi & lihat jalur</span>
            </div>
          </aside>

          <ScanForm />
        </div>
      </main>
    </>
  );
}
