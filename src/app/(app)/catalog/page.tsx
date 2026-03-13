"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBGameService } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { formatBarters, formatRubles } from "@/lib/utils";
import {
  ShoppingCart,
  Loader2,
  Package,
  Infinity,
  Plus,
  Check,
  ChevronLeft,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { QRModal } from "@/components/qr-modal";

export default function CatalogPage() {
  const { activeGame, myParticipant, refreshGame } = useGame();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<DBGameService[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [myServices, setMyServices] = useState<{ id: string; title: string }[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addingServiceId, setAddingServiceId] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);
  const [qrService, setQrService] = useState<{ id: string; title: string } | null>(null);

  const gameId = activeGame?.id;

  const loadCatalog = useCallback(() => {
    if (!gameId) return;
    api.getGameCatalog(gameId)
      .then(setCatalog)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const loadMyServices = useCallback(async () => {
    try {
      const services = await api.getMyServices();
      const activeServices = services.filter((s) => s.is_active);
      const listedIds = new Set(catalog.map((gs) => gs.service_id));
      setMyServices(
        activeServices
          .filter((s) => !listedIds.has(s.id))
          .map((s) => ({ id: s.id, title: s.title }))
      );
    } catch {
      // ignore
    }
  }, [catalog]);

  const handleShowAdd = async () => {
    setShowAddPanel(true);
    setAdding(true);
    await loadMyServices();
    setAdding(false);
  };

  const handleAddService = async (serviceId: string) => {
    if (!gameId) return;
    setAddingServiceId(serviceId);
    try {
      await api.addServiceToGame(gameId, serviceId);
      loadCatalog();
      setShowAddPanel(false);
    } catch (err) {
      console.error("Add service error:", err);
    } finally {
      setAddingServiceId(null);
    }
  };

  const handleBuy = async (gameServiceId: string) => {
    if (!gameId) return;
    setBuying(gameServiceId);
    try {
      await api.buyCertificate(gameId, gameServiceId);
      setBought(gameServiceId);
      loadCatalog();
      if (gameId) refreshGame(gameId);
      setTimeout(() => setBought(null), 2000);
    } catch (err) {
      console.error("Buy error:", err);
    } finally {
      setBuying(null);
    }
  };

  if (!activeGame) {
    return (
      <div className="p-4 text-center py-20">
        <Package className="w-10 h-10 text-warm-300 mx-auto mb-3" />
        <p className="text-warm-400 mb-4">Выберите игру, чтобы увидеть каталог</p>
        <Link href="/games">
          <Button size="sm">К играм</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  const balance = myParticipant?.balance_b ?? 0;

  return (
    <div className="p-4 space-y-5">
      <Link href={`/games/${activeGame.id}`} className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> {activeGame.title}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Каталог</h1>
          <p className="text-sm text-warm-400">
            {catalog.length} {catalog.length === 1 ? "предложение" : "предложений"} · Баланс: {formatBarters(balance)}
          </p>
        </div>
        {myParticipant && (
          <Button size="sm" variant="outline" onClick={handleShowAdd}>
            <Plus className="w-4 h-4" /> Моё
          </Button>
        )}
      </div>

      {showAddPanel && (
        <Card>
          <h3 className="font-semibold text-warm-700 text-sm mb-3">Добавить моё предложение в игру</h3>
          {adding ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-warm-400" />
            </div>
          ) : myServices.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-warm-400 mb-3">Нет предложений для добавления</p>
              <Link href="/services">
                <Button size="sm" variant="outline">Создать предложение</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-warm-200/40 hover:bg-cream-50">
                  <span className="text-sm text-warm-700">{s.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddService(s.id)}
                    disabled={addingServiceId === s.id}
                  >
                    {addingServiceId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Добавить
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setShowAddPanel(false)}
          >
            Закрыть
          </Button>
        </Card>
      )}

      {catalog.length === 0 && !showAddPanel && (
        <Card className="text-center py-12">
          <Package className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-400 mb-4">Каталог пока пуст</p>
          {myParticipant && (
            <Button size="sm" onClick={handleShowAdd}>
              <Plus className="w-4 h-4" /> Добавить предложение
            </Button>
          )}
        </Card>
      )}

      {qrService && gameId && (
        <QRModal
          url={`${typeof window !== "undefined" ? window.location.origin : ""}/buy?gs=${qrService.id}&g=${gameId}`}
          title={qrService.title}
          subtitle="Покупатель сканирует этот QR"
          onClose={() => setQrService(null)}
        />
      )}

      <div className="space-y-3">
        {catalog.map((gs) => {
          const service = gs.service;
          if (!service) return null;

          const owner = service.owner;
          const ownerName = owner
            ? `${owner.first_name}${owner.last_name ? ` ${owner.last_name}` : ""}`
            : "Участник";
          const isOwn = user?.id === service.owner_id;
          const canBuy = myParticipant && !isOwn && balance >= service.price_b && gs.is_active;
          const isBought = bought === gs.id;

          return (
            <Card key={gs.id} className="relative">
              <div className="flex items-start gap-3">
                <Avatar name={ownerName} src={owner?.photo_url} size="md" className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-semibold text-warm-800 text-sm">{service.title}</h3>
                      <p className="text-xs text-warm-400 mt-0.5">{ownerName}</p>
                    </div>
                    {isOwn && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setQrService({ id: gs.id, title: service.title })}
                          className="p-1.5 text-warm-400 hover:text-brand-amber transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <Badge variant="outline" className="text-[10px]">Моё</Badge>
                      </div>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-warm-500 mt-2 leading-relaxed">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap mt-3">
                    <Badge variant="amber">{formatBarters(service.price_b)}</Badge>
                    {service.original_price_rub && (
                      <span className="text-xs text-warm-400">= {formatRubles(service.original_price_rub)}</span>
                    )}
                    <span className="text-xs text-warm-400 flex items-center gap-1">
                      {gs.quantity_remaining === null ? (
                        <><Infinity className="w-3 h-3" /> шт</>
                      ) : (
                        <>{gs.quantity_remaining} шт</>
                      )}
                    </span>
                  </div>
                  {!isOwn && myParticipant && (
                    <div className="mt-3">
                      {isBought ? (
                        <Button size="sm" variant="secondary" disabled>
                          <Check className="w-3.5 h-3.5" />
                          Куплено
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleBuy(gs.id)}
                          disabled={!canBuy || buying === gs.id}
                        >
                          {buying === gs.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          )}
                          Купить
                        </Button>
                      )}
                      {balance < service.price_b && (
                        <span className="text-[10px] text-brand-coral ml-2">Недостаточно Б</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
