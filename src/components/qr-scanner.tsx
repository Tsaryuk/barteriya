"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== "undefined";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let detector: any = null;
        let jsQR: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null = null;

        if (hasBarcodeDetector) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        } else {
          const mod = await import("jsqr");
          jsQR = mod.default;
        }

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        const scan = () => {
          if (!active || !videoRef.current || videoRef.current.readyState !== 4) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          if (detector) {
            detector.detect(canvas).then((results: { rawValue: string }[]) => {
              if (results.length > 0 && active) {
                active = false;
                onScanRef.current(results[0].rawValue);
              }
            }).catch(() => {});
          } else if (jsQR) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code && active) {
              active = false;
              onScanRef.current(code.data);
              return;
            }
          }

          rafRef.current = requestAnimationFrame(scan);
        };

        rafRef.current = requestAnimationFrame(scan);
      } catch (err) {
        console.error("Camera error:", err);
        if (active) setError("Не удалось получить доступ к камере. Проверьте разрешения.");
      }
    }

    start();

    return () => {
      active = false;
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 relative z-10">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-medium">Сканировать QR-код</span>
        </div>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-center px-4">
            <p className="text-white/60 mb-4">{error}</p>
            <Button variant="outline" onClick={onClose}>Закрыть</Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="relative z-10 w-64 h-64 border-2 border-white/40 rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
            </div>
            <p className="absolute bottom-8 left-0 right-0 text-white/50 text-sm text-center z-10">
              Наведите камеру на QR-код
            </p>
          </>
        )}
      </div>
    </div>
  );
}
