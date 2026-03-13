"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBGameService } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { useGame } from "@/context/game";
import { formatBarters, formatRubles } from "@/lib/utils";
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Infinity,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function BuyContent() {
  const params = useSearchParams();
  const gameServiceId = params.get("gs");
  const gameId = params.get("g");
  const { user } = useAuth();
  const { myParticipant, refreshGame } = useGame();

  const [service, setService] = useState<DBGameService | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!gameId || !gameServiceId) {
      setLoading(false);
      return;
    }
    api.getGameCatalog(gameId)
      .then((catalog) => {
        const found = catalog.find((gs) => gs.id === gameServiceId);
        setService(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId, gameServiceId]);

  const handleBuy = async () => {
    if (!gameId || !gameServiceId) return;
    setBuying(true);
    setErrorMsg("");
    try {
      await api.buyCertificate(gameId, gameServiceId);
      setResult("success");
      if (gameId) refreshGame(gameId);
    } catch (err) {
      setResult("error");
      setErrorMsg(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!gameId || !gameServiceId || !service) {
    return (
      <div className="p-4 text-center py-20">
        <AlertCircle className="w-10 h-10 text-warm-300 mx-auto mb-3" />
        <p className="text-warm-400 mb-4">Предложение не найдено</p>
        <Link href="/catalog">
          <Button size="sm">В каталог</Button>
        </Link>
      </div>
    );
  }

  if (result === "success") {
    return (
      <div className="p-4 text-center py-20">
        <CheckCircle2 className="w-16 h-16 text-brand-sage mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-warm-800 mb-2">Куплено!</h2>
        <p className="text-sm text-warm-400 mb-6">
          Сертификат на &laquo;{service.service?.title}&raquo; появился в ваших покупках
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/certificates">
            <Button size="sm">Мои сертификаты</Button>
          </Link>
          <Link href="/catalog">
            <Button size="sm" variant="outline">В каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  const svc = service.service;
  if (!svc) return null;

  const owner = svc.owner;
  const ownerName = owner
    ? `${owner.first_name}${owner.last_name ? ` ${owner.last_name}` : ""}`
    : "Участник";
  const balance = myParticipant?.balance_b ?? 0;
  const isOwn = user?.id === svc.owner_id;
  const canBuy = myParticipant && !isOwn && balance >= svc.price_b && service.is_active;

  return (
    <div className="p-4 space-y-5">
      <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> Каталог
      </Link>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={ownerName} size="lg" />
          <div>
            <h2 className="font-display font-bold text-lg text-warm-800">{svc.title}</h2>
            <p className="text-sm text-warm-400">{ownerName}</p>
          </div>
        </div>

        {svc.description && (
          <p className="text-sm text-warm-500 leading-relaxed mb-4">{svc.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Badge variant="amber" className="text-base px-3 py-1">
            {formatBarters(svc.price_b)}
          </Badge>
          {svc.original_price_rub && (
            <span className="text-sm text-warm-400">= {formatRubles(svc.original_price_rub)}</span>
          )}
          <span className="text-xs text-warm-400 flex items-center gap-1">
            {service.quantity_remaining === null ? (
              <><Infinity className="w-3 h-3" /> шт</>
            ) : (
              <>{service.quantity_remaining} шт</>
            )}
          </span>
        </div>

        <div className="bg-cream-50 rounded-xl p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-warm-500">Ваш баланс</span>
            <span className="font-semibold text-warm-800">{formatBarters(balance)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-warm-500">После покупки</span>
            <span className={`font-semibold ${balance >= svc.price_b ? "text-brand-sage" : "text-brand-coral"}`}>
              {formatBarters(balance - svc.price_b)}
            </span>
          </div>
        </div>

        {result === "error" && (
          <div className="bg-red-50 rounded-xl p-3 mb-4 text-sm text-brand-coral">
            {errorMsg}
          </div>
        )}

        {isOwn ? (
          <p className="text-sm text-warm-400 text-center">Это ваше предложение</p>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={handleBuy}
            disabled={!canBuy || buying}
          >
            {buying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
            Купить за {formatBarters(svc.price_b)}
          </Button>
        )}
        {!isOwn && balance < svc.price_b && (
          <p className="text-xs text-brand-coral text-center mt-2">Недостаточно Бартеров</p>
        )}
      </Card>
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense fallback={
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    }>
      <BuyContent />
    </Suspense>
  );
}
