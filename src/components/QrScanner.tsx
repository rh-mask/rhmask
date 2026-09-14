"use client";

import { useEffect, useRef, useState } from "react";
import { decodeQr, decodeQrFile } from "@/lib/qr";

/**
 * Camera QR scanner with an image-file fallback. Opens on demand, stops the
 * camera the moment a code is read or the panel closes. No frames leave the
 * device: decoding runs in the page.
 */
export function QrScanner({ onResult, label = "Scan QR" }: { onResult: (text: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let cancelled = false;
    const video = videoRef.current;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("No camera access in this browser. Upload a QR image instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setError("Camera permission denied. Upload a QR image instead.");
        return;
      }
      if (cancelled || !video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      const tick = async () => {
        if (cancelled || !video || video.readyState < 2) {
          timer = window.setTimeout(tick, 150);
          return;
        }
        const text = await decodeQr(video);
        if (text && !cancelled) {
          onResult(text);
          setOpen(false);
          return;
        }
        timer = window.setTimeout(tick, 150);
      };
      tick();
    }
    start();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
  }, [open, onResult]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const text = await decodeQrFile(file);
      if (!text) {
        setError("No QR code found in that image.");
        return;
      }
      onResult(text);
      setOpen(false);
    } catch {
      setError("Could not read that image.");
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => {
            setError(null);
            setOpen((v) => !v);
          }}
        >
          {open ? "Close camera" : label}
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => fileRef.current?.click()}>
          Upload QR image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            onFile(f);
          }}
        />
      </div>
      {open && (
        <div className="relative overflow-hidden rounded-xl border border-line bg-ink-3 aspect-square max-w-xs">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-mask/70" aria-hidden="true" />
        </div>
      )}
      {error && <p className="text-xs text-warn">{error}</p>}
    </div>
  );
}
