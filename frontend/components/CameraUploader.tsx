"use client";

import { Camera, Images, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type PhotoItem = { file: File; url: string };

export function CameraUploader({
  value,
  onChange,
}: {
  value: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(
    () => () => stream?.getTracks().forEach((track) => track.stop()),
    [stream]
  );

  async function openCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraError(null);

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(media);

      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch {
      setCameraError(
        "Kamera tidak dapat dibuka. Pastikan izin kamera browser aktif, atau pilih foto dari galeri."
      );
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || value.length >= 3) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    if (!blob) return;

    const file = new File([blob], `kamera-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    onChange([...value, { file, url: URL.createObjectURL(file) }]);
  }

  function addGallery(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 3 - value.length);

    onChange([
      ...value,
      ...selected.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ]);

    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    const photo = value[index];

    if (photo?.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }

    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="scan-camera-wrap">
      <div className="camera-shell scan-camera-shell">
        <div className="camera-view scan-camera-view">
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: stream ? "block" : "none" }}
          />

          {!stream && (
            <div className="camera-empty scan-camera-empty">
              <Camera size={38} strokeWidth={1.5} />
              <strong>Kamera belum aktif</strong>
              <span>Aktifkan kamera atau pilih foto dari galeri.</span>
            </div>
          )}

          {stream && <div className="camera-guide" />}
        </div>

        <canvas ref={canvasRef} hidden />

        <div className="camera-controls scan-camera-controls">
          {!stream ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={openCamera}
            >
              <Camera size={17} />
              Buka Kamera
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-small"
                type="button"
                onClick={stopCamera}
              >
                Tutup
              </button>

              <button
                className="capture-btn"
                type="button"
                onClick={capture}
                aria-label="Ambil foto"
                disabled={value.length >= 3}
              />

              <button
                className="btn btn-ghost btn-small"
                type="button"
                onClick={openCamera}
              >
                <RefreshCw size={16} />
                Ulang
              </button>
            </>
          )}

          <button
            className="btn btn-orange"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={value.length >= 3}
          >
            <Images size={17} />
            Pilih Galeri
          </button>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => addGallery(event.target.files)}
          />
        </div>
      </div>

      {cameraError && (
        <div className="alert alert-warning">{cameraError}</div>
      )}

      {value.length > 0 && (
        <div className="preview-grid scan-preview-grid">
          {value.map((photo, index) => (
            <div
              className="preview-item scan-preview-item"
              key={`${photo.file.name}-${index}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={`Foto hasil tani ${index + 1}`} />

              <button
                className="preview-remove"
                type="button"
                aria-label="Hapus foto"
                onClick={() => remove(index)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="scan-note scan-note-scan">
        Gunakan foto yang jelas, isi sebagian besar frame dengan hasil tani, dan
        hindari blur berat atau cahaya dari belakang. Maksimum 3 foto.
      </div>
    </div>
  );
}
