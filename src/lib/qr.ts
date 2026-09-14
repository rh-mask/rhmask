"use client";

import QRCode from "qrcode";
import jsQR from "jsqr";

/**
 * QR helpers. Generation is synchronous (module matrix -> inline SVG), so a
 * QR renders on the first frame with no effect and no image request.
 * Decoding uses the native BarcodeDetector where it exists and falls back
 * to jsQR over a canvas frame everywhere else.
 */

export type QrMatrix = { size: number; bits: Uint8Array };

export function qrMatrix(text: string): QrMatrix {
  const code = QRCode.create(text, { errorCorrectionLevel: "M" });
  return { size: code.modules.size, bits: code.modules.data as Uint8Array };
}

/** One SVG path covering every dark module; scales with CSS. */
export function qrPath(m: QrMatrix) {
  let d = "";
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (m.bits[y * m.size + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

type Detector = { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

function nativeDetector(): Detector | null {
  const ctor = (globalThis as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (!ctor) return null;
  try {
    return new ctor({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

/** Decode a QR from a video element or an image. Returns null when nothing is found. */
export async function decodeQr(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<string | null> {
  const native = nativeDetector();
  if (native) {
    try {
      const found = await native.detect(source);
      if (found.length && found[0].rawValue) return found[0].rawValue;
    } catch {
      /* fall through to jsQR */
    }
  }
  const w = "videoWidth" in source ? source.videoWidth : source.width;
  const h = "videoHeight" in source ? source.videoHeight : source.height;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
  return res?.data ?? null;
}

/** Decode a QR from a picked image file (screenshot, saved QR). */
export async function decodeQrFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    return await decodeQr(bitmap);
  } finally {
    bitmap.close();
  }
}
