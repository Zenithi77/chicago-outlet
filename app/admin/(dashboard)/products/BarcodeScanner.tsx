"use client";

import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

// Full-screen camera barcode scanner. Prefers the rear camera and works on
// mobile browsers (incl. iOS Safari) via getUserMedia + ZXing decoding.
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let done = false;

    (async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          video,
          (result) => {
            if (result && !done) {
              done = true;
              const text = result.getText().replace(/\D/g, "");
              controls?.stop();
              onDetected(text);
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
        <span className="text-sm font-semibold">Штрих код уншуулах</span>
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
            <div className="h-36 w-72 max-w-[80%] rounded-xl border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}
        {error && (
          <p className="absolute inset-x-6 bottom-24 rounded-lg bg-danger/90 px-4 py-3 text-center text-sm text-white">
            {error}
          </p>
        )}
      </div>

      <p className="px-6 py-5 text-center text-xs text-white/70">
        Барааны штрих кодыг хүрээн дотор байрлуулна уу — автоматаар уншина.
      </p>
    </div>
  );
}
