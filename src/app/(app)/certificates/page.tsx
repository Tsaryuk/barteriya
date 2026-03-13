"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBPurchasedCertificate } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { formatBarters, formatTimeAgo } from "@/lib/utils";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Store,
  Star,
  Send,
} from "lucide-react";
import { useState, useEffect } from "react";

const STATUS_CONFIG = {
  active: { label: "Активен", variant: "amber" as const, icon: <Clock className="w-3.5 h-3.5" /> },
  redeemed: { label: "Погашен", variant: "sage" as const, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  expired: { label: "Истёк", variant: "coral" as const, icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function CertificatesPage() {
  const { activeGame } = useGame();
  const { user } = useAuth();
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");
  const [filter, setFilter] = useState<"all" | "active" | "redeemed">("all");
  const [certificates, setCertificates] = useState<DBPurchasedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchData = tab === "purchases"
      ? api.getMyPurchases(activeGame?.id)
      : api.getMySales(activeGame?.id);
    fetchData
      .then(setCertificates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGame, tab]);

  const handleRedeem = async (certId: string) => {
    setRedeeming(certId);
    try {
      const updated = await api.redeemCertificate(certId);
      setCertificates((prev) => prev.map((c) => (c.id === certId ? updated : c)));
    } catch (err) {
      console.error("Redeem error:", err);
    } finally {
      setRedeeming(null);
    }
  };

  const filtered = filter === "all"
    ? certificates
    : certificates.filter((c) => c.status === filter);

  const getPersonName = (person?: { first_name: string; last_name: string | null }) => {
    if (!person) return "Участник";
    return `${person.first_name}${person.last_name ? ` ${person.last_name}` : ""}`;
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
        <p className="text-sm text-warm-400">Купленные и проданные сертификаты</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setTab("purchases"); setFilter("all"); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "purchases"
              ? "bg-brand-amber text-white shadow-warm"
              : "bg-white text-warm-400 border border-warm-200 hover:border-warm-300"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Покупки
        </button>
        <button
          onClick={() => { setTab("sales"); setFilter("all"); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "sales"
              ? "bg-brand-amber text-white shadow-warm"
              : "bg-white text-warm-400 border border-warm-200 hover:border-warm-300"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Продажи
        </button>
      </div>

      <div className="flex gap-2">
        {([
          ["all", "Все"],
          ["active", "Активные"],
          ["redeemed", "Погашенные"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key
                ? "bg-warm-200 text-warm-700"
                : "text-warm-400 hover:text-warm-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3 stagger-children">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-warm-400 text-center py-4">
              {tab === "purchases" ? "Нет купленных сертификатов" : "Нет проданных сертификатов"}
            </p>
          </Card>
        ) : (
          filtered.map((cert) => {
            const status = STATUS_CONFIG[cert.status];
            const sellerName = getPersonName(cert.seller);
            const buyerName = getPersonName(cert.buyer);
            const serviceName = cert.service?.title || "Услуга";
            const isSeller = user?.id === cert.seller_id;

            return (
              <Card key={cert.id} className="relative overflow-hidden">
                {cert.status === "active" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-amber rounded-full" />
                )}
                {cert.status === "redeemed" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-sage rounded-full" />
                )}

                <div className="flex items-start justify-between mb-2">
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    {status.icon}
                    {status.label}
                  </Badge>
                  <span className="text-xs text-warm-400">{formatTimeAgo(new Date(cert.created_at))}</span>
                </div>

                <h3 className="text-sm font-semibold text-warm-800 mb-1">{serviceName}</h3>
                {cert.service?.description && (
                  <p className="text-xs text-warm-500 mb-3">{cert.service.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={sellerName} size="sm" />
                    <div>
                      <div className="text-[10px] text-warm-400">Продавец</div>
                      <div className="text-xs font-medium text-warm-600">{sellerName}</div>
                    </div>
                    <span className="text-warm-300 mx-1">&rarr;</span>
                    <Avatar name={buyerName} size="sm" />
                    <div>
                      <div className="text-[10px] text-warm-400">Покупатель</div>
                      <div className="text-xs font-medium text-warm-600">{buyerName}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-100">
                  <div className="font-display font-semibold text-brand-amber">
                    {formatBarters(cert.amount_b)}
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.status === "active" && isSeller && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRedeem(cert.id)}
                        disabled={redeeming === cert.id}
                      >
                        {redeeming === cert.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileCheck className="w-3.5 h-3.5" />
                        )}
                        Погасить
                      </Button>
                    )}
                    {cert.status === "redeemed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewingId(reviewingId === cert.id ? null : cert.id)}
                      >
                        <Star className="w-3.5 h-3.5" />
                        Отзыв
                      </Button>
                    )}
                    {cert.expires_at && cert.status === "active" && (
                      <span className="text-[10px] text-warm-400">
                        до {new Date(cert.expires_at).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                </div>

                {reviewingId === cert.id && (
                  <ReviewForm
                    purchaseId={cert.id}
                    onDone={() => setReviewingId(null)}
                  />
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReviewForm({ purchaseId, onDone }: { purchaseId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createReview(purchaseId, rating, text.trim() || undefined);
      setSuccess(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка";
      setError(msg);
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="mt-3 pt-3 border-t border-warm-100 text-center py-3">
        <CheckCircle2 className="w-6 h-6 text-brand-sage mx-auto mb-1" />
        <p className="text-sm text-brand-sage font-medium">Отзыв отправлен</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-warm-100 space-y-3">
      <div>
        <label className="text-xs font-medium text-warm-500 mb-2 block">Оценка</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  n <= rating
                    ? "text-amber-400 fill-amber-400"
                    : "text-warm-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <textarea
          className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-amber/40"
          rows={2}
          placeholder="Комментарий (необязательно)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-brand-coral">{error}</p>}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Отправить
      </Button>
    </form>
  );
}
