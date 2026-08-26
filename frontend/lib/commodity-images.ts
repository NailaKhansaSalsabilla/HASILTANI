"use client";

import type { Commodity } from "./types";

export const commodityCover: Record<Commodity, string> = {
  tomat: "/commodities/tomat.jpg",
  pisang: "/commodities/pisang.jpg",
  mangga: "/commodities/mangga.jpg",
  jeruk: "/commodities/jeruk.jpg",
};

const SAMPLE_IMAGE_PATH = /^\/(?:images\/(?:tomat|pisang|mangga|jeruk)-|samples\/(?:tomat|pisang|mangga|jeruk)\.webp$)/i;

export function resolveBatchCover(
  commodity: Commodity,
  coverImage?: string | null
) {
  if (!coverImage || SAMPLE_IMAGE_PATH.test(coverImage)) {
    return commodityCover[commodity];
  }

  return coverImage;
}

/**
 * Local/demo mode has no object storage, so the first photo supplied by the
 * farmer is compressed into a reasonably small JPEG data URL and persisted
 * with the demo batch. This keeps the real batch photo visible after refresh.
 */
export async function localBatchPhotoDataUrl(
  file: File,
  maxSide = 820,
  quality = 0.76
): Promise<string> {
  const source = await fileToDataUrl(file);
  const image = await loadImage(source);

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) return source;

  const scale = Math.min(1, maxSide / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return source;

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return source;
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Foto batch tidak dapat dibaca."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto batch tidak dapat diproses."));
    image.src = src;
  });
}
