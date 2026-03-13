"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, DBTariff } from "@/lib/api";
import { formatRubles } from "@/lib/utils";
import { Check, Star, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TariffsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-warm-400" /></div>}>
      <TariffsContent />
    </Suspense>
  );
}

function TariffsContent() {
  const [tariffs, setTariffs] = useState<DBTariff[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    api.getTariffs().then((data) => {
      setTariffs(data);
      // Select the most expensive active tariff by default (or first)
      const popular = data.find((t) => t.original_price_rub && t.price_rub > 10000);
      setSelected(popular?.id || data[0]?.id || "");
      setLoading(false);
    });
  }, []);

  const handlePay = async () => {
    if (!selected || paying) return;
    setPaying(true);
    try {
      const { confirmationUrl } = await api.createPayment(selected);
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaying(false);
    }
  };

  const selectedTariff = tariffs.find((t) => t.id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-warm-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> Профиль
      </Link>

      {paymentStatus === "success" && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          Оплата обрабатывается. Тариф будет активирован в течение нескольких минут.
        </div>
      )}

      <div>
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Тарифы</h1>
        <p className="text-sm text-warm-400">Доступ ко всем играм клуба</p>
      </div>

      <div className="space-y-3 stagger-children">
        {tariffs.map((tariff) => {
          const isPopular = tariff.original_price_rub && tariff.price_rub > 10000;
          const discount = tariff.original_price_rub
            ? Math.round((1 - tariff.price_rub / tariff.original_price_rub) * 100)
            : null;

          return (
            <button
              key={tariff.id}
              onClick={() => setSelected(tariff.id)}
              className={`w-full text-left rounded-3xl p-5 border-2 transition-all ${
                selected === tariff.id
                  ? isPopular
                    ? "border-brand-amber bg-brand-amber-light/30 shadow-warm"
                    : "border-brand-amber bg-white shadow-warm"
                  : "border-warm-200/60 bg-white shadow-card"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-warm-800">{tariff.name}</h3>
                    {isPopular && (
                      <Badge variant="amber" className="text-[10px]">
                        <Star className="w-2.5 h-2.5 mr-0.5" /> Хит
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-warm-400 mt-0.5">
                    {tariff.duration_days ? `${tariff.duration_days} дней` : "Безлимит"}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected === tariff.id
                    ? "border-brand-amber bg-brand-amber"
                    : "border-warm-300"
                }`}>
                  {selected === tariff.id && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-2xl text-warm-800">
                  {formatRubles(tariff.price_rub)}
                </span>
                {tariff.original_price_rub && (
                  <>
                    <span className="text-sm text-warm-400 line-through">{formatRubles(tariff.original_price_rub)}</span>
                    {discount && <Badge variant="sage" className="text-[10px]">-{discount}%</Badge>}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Button size="lg" className="w-full" onClick={handlePay} disabled={paying || !selected}>
        {paying ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        {paying ? "Перенаправление..." : `Оплатить ${selectedTariff ? formatRubles(selectedTariff.price_rub) : ""}`}
      </Button>
    </div>
  );
}
