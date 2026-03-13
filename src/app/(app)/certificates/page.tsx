"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBCertificate } from "@/lib/api";
import { useGame } from "@/context/game";
import { formatBarters, formatTimeAgo } from "@/lib/utils";
import { FileCheck, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const STATUS_CONFIG = {
  active: { label: "Активен", variant: "amber" as const, icon: <Clock className="w-3.5 h-3.5" /> },
  activated: { label: "Выполнен", variant: "sage" as const, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: "Отменён", variant: "coral" as const, icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function CertificatesPage() {
  const { activeGame } = useGame();
  const [filter, setFilter] = useState<"all" | "active" | "activated">("all");
  const [certificates, setCertificates] = useState<DBCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getCertificates(activeGame?.id)
      .then(setCertificates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGame]);

  const handleActivate = async (certId: string) => {
    setActivating(certId);
    try {
      const updated = await api.activateCertificate(certId);
      setCertificates((prev) => prev.map((c) => (c.id === certId ? updated : c)));
    } catch (err) {
      console.error("Activate error:", err);
    } finally {
      setActivating(null);
    }
  };

  const filtered = filter === "all"
    ? certificates
    : certificates.filter((c) => c.status === filter);

  const getPersonName = (cert: DBCertificate, role: "seller" | "buyer") => {
    const p = cert[role];
    if (!p) return "Участник";
    return `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`;
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Сертификаты</h1>
        <p className="text-sm text-warm-400">Подтверждения заключённых сделок</p>
      </div>

      <div className="flex gap-2">
        {([
          ["all", "Все"],
          ["active", "Активные"],
          ["activated", "Выполненные"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? "bg-brand-amber text-white shadow-warm"
                : "bg-white text-warm-400 border border-warm-200 hover:border-warm-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3 stagger-children">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-warm-400 text-center py-4">Сертификатов нет</p>
          </Card>
        ) : (
          filtered.map((cert) => {
            const status = STATUS_CONFIG[cert.status];
            const sellerName = getPersonName(cert, "seller");
            const buyerName = getPersonName(cert, "buyer");

            return (
              <Card key={cert.id} className="relative overflow-hidden">
                {cert.status === "active" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-amber rounded-full" />
                )}
                {cert.status === "activated" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-sage rounded-full" />
                )}

                <div className="flex items-start justify-between mb-3">
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    {status.icon}
                    {status.label}
                  </Badge>
                  <span className="text-xs text-warm-400">{formatTimeAgo(new Date(cert.created_at))}</span>
                </div>

                <p className="text-sm font-medium text-warm-700 mb-3">{cert.service_description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={sellerName} size="sm" />
                    <div>
                      <div className="text-xs text-warm-400">Продавец</div>
                      <div className="text-sm font-medium text-warm-600">{sellerName}</div>
                    </div>
                    <span className="text-warm-300 mx-1">→</span>
                    <Avatar name={buyerName} size="sm" />
                    <div>
                      <div className="text-xs text-warm-400">Покупатель</div>
                      <div className="text-sm font-medium text-warm-600">{buyerName}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100">
                  <div className="font-display font-semibold text-brand-amber">
                    {formatBarters(cert.amount_b)}
                  </div>
                  {cert.status === "active" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleActivate(cert.id)}
                      disabled={activating === cert.id}
                    >
                      {activating === cert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileCheck className="w-3.5 h-3.5" />
                      )}
                      Активировать
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
