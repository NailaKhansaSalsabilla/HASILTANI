"use client";

import { AlertTriangle, ArrowRight, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { analyzeProduce } from "@/lib/api";
import type { AnalysisResult, Commodity } from "@/lib/types";
import { CameraUploader, type PhotoItem } from "./CameraUploader";
import { CommodityPicker } from "./CommodityPicker";

const VALID_COMMODITIES: Commodity[] = ["tomat", "pisang", "mangga", "jeruk"];

export function ScanForm({
  onResult,
}: {
  onResult?: (
    result: AnalysisResult,
    photos: PhotoItem[]
  ) => void | Promise<void>;
}) {
  const router = useRouter();
  const [commodity, setCommodity] = useState<Commodity>("tomat");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("commodity");
    if (requested && VALID_COMMODITIES.includes(requested as Commodity)) {
      setCommodity(requested as Commodity);
    }
  }, []);

  async function submit() {
    if (!photos.length) {
      setError("Tambahkan minimal satu foto melalui kamera atau galeri.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeProduce(
        commodity,
        photos.map((photo) => photo.file)
      );

      sessionStorage.setItem("hasiltani:last-analysis", JSON.stringify(result));
      sessionStorage.setItem("hasiltani:last-photo", photos[0].url);

      if (onResult) await onResult(result, photos);
      else router.push("/scan/result");
    } catch (errorValue) {
      setError(
        errorValue instanceof Error ? errorValue.message : "Analisis gagal."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="form-card scan-card analysis-loading scan-loading">
        <div>
          <div className="pulse-orb">
            <div className="pulse-core">
              <ScanLine size={30} />
            </div>
          </div>
          <h2>Menganalisis kondisi visual…</h2>
          <p className="muted">
            Setiap foto dianalisis dalam beberapa tampilan ringan, lalu hasil
            1–3 foto digabung menjadi satu consensus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card scan-card">
      <div className="scan-card-head">
        <span className="scan-card-kicker">HASILTANI VISION</span>
        <h1>Analisis hasil tani</h1>
        <p>
          Pilih komoditas yang sesuai. Gunakan 1–3 foto; dua sudut atau lebih
          membantu consensus lebih stabil pada foto nyata.
        </p>
      </div>

      <CommodityPicker
        value={commodity}
        onChange={(next) => {
          setCommodity(next);
          setPhotos([]);
          setError(null);
        }}
      />

      <CameraUploader value={photos} onChange={setPhotos} />

      {photos.length === 1 && (
        <div className="alert alert-warning scan-alert">
          <AlertTriangle
            size={16}
            style={{ verticalAlign: "-3px", marginRight: 7 }}
          />
          Satu foto siap dianalisis. Jika memungkinkan, tambahkan satu sudut lain
          agar hasil lebih stabil.
        </div>
      )}

      {photos.length >= 2 && (
        <div className="alert scan-ready">
          <strong>{photos.length} foto siap.</strong> HASILTANI akan
          menggabungkan hasil antar-sudut.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertTriangle
            size={16}
            style={{ verticalAlign: "-3px", marginRight: 7 }}
          />
          {error}
        </div>
      )}

      <div className="scan-submit">
        <button
          className="btn btn-primary scan-submit-button"
          type="button"
          onClick={submit}
          disabled={!photos.length}
        >
          <ScanLine size={17} />
          Analisis Sekarang
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
