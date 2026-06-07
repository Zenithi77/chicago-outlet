"use client";

import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

// Full-screen camera barcode scanner. Prefers the rear camera, restricts to
// common retail 1D formats, and enables TRY_HARDER for faster recognition.
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Камер бэлдэж байна…");

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let done = false;

    (async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const [{ BrowserMultiFormatReader }, zxing] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        const { BarcodeFormat, DecodeHintType } = zxing;

        // Only retail-relevant 1D formats → much faster than the default
        // "try every format" pass that BrowserMultiFormatReader does.
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        // Decode roughly every 120 ms (~8 fps) — keeps CPU low but still snappy.
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 120,
        });

        setStatus("Кодыг хүрээ дотор байрлуулна уу");

        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              // @ts-expect-error advanced focus hints (Chrome only)
              advanced: [{ focusMode: "continuous" }],
            },
          },
          video,
          (result, err) => {
            if (done) return;
            if (result) {
              done = true;
              const text = result.getText().replace(/\D/g, "");
              if (text.length >= 6) {
                try {
                  (navigator as Navigator & { vibrate?: (p: number) => void })
                    .vibrate?.(60);
                } catch {}
                controls?.stop();
                onDetected(text);
              } else {
                done = false;
              }
            } else if (err && err.name !== "NotFoundException") {
              // ignore noisy "not found" frames
            }
          }
        );
      } catch {
        setError(
          "Камер нээх боломжгүй байна. Камерын зөвшөөрөл олгосон эсэхээ шалгана уу."
        );
      }
    })();

    return () => {
      done = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <span className="text-sm font-semibold">Barcode уншуулах</span>
        <button
          onClick={onClose}
          className="rounded-full bg-white/15 px-4 py-1.5 text-sm hover:bg-white/25"
        >
          Хаах
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-80 max-w-[85%] rounded-xl border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-accent" />
            </div>
          </div>
        )}
        {error && (
          <p className="absolute inset-x-6 bottom-24 rounded-lg bg-danger/90 px-4 py-3 text-center text-sm text-white">
            {error}
          </p>
        )}
      </div>

      <p className="px-6 py-5 text-center text-xs text-white/70">
        {error ? "" : status}
      </p>
    </div>
  );
}
