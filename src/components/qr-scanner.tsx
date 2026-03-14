"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const containerId = "qr-reader";

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      setReady(true);

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {}
        )
        .catch((err: unknown) => {
          console.error("QR scanner error:", err);
          setError("Не удалось получить доступ к камере. Проверьте разрешения.");
        });
    }).catch(() => {
      setError("Не удалось загрузить сканер");
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-medium">Сканировать QR-код</span>
        </div>
        <button
          onClick={() => {
            if (scannerRef.current) {
              scannerRef.current.stop().catch(() => {});
            }
            onClose();
          }}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        {error ? (
          <div className="text-center">
            <p className="text-white/60 mb-4">{error}</p>
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {!ready && (
              <p className="text-white/40 text-sm text-center mb-4">Загрузка камеры...</p>
            )}
            <div id={containerId} className="rounded-2xl overflow-hidden" />
            <p className="text-white/40 text-sm text-center mt-4">
              Наведите камеру на QR-код
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
