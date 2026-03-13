"use client";

import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";

interface QRModalProps {
  url: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function QRModal({ url, title, subtitle, onClose }: QRModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-warm-400 hover:text-warm-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h3 className="font-display font-bold text-lg text-warm-800 mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-warm-400 mb-4">{subtitle}</p>}
          <div className="bg-white p-4 rounded-2xl border border-warm-100 inline-block mb-4">
            <QRCodeSVG
              value={url}
              size={200}
              level="M"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#2D2A26"
            />
          </div>
          <p className="text-xs text-warm-400">
            Покажите этот QR-код покупателю
          </p>
        </div>
      </div>
    </div>
  );
}
