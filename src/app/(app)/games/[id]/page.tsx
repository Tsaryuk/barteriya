"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBGame } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { formatBarters, formatRubles } from "@/lib/utils";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  Mic,
  Landmark,
  ArrowRightLeft,
  ChevronLeft,
  Loader2,
  ShoppingBag,
  QrCode,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

const STATUS_MAP: Record<string, { label: string; variant: "sage" | "outline" | "amber" | "default" }> = {
  open: { label: "Открыта", variant: "sage" },
  draft: { label: "Скоро", variant: "outline" },
  active: { label: "Идёт", variant: "amber" },
  done: { label: "Завершена", variant: "default" },
  archive: { label: "Архив", variant: "default" },
};

export default function GameDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const { user } = useAuth();
  const { setActiveGame } = useGame();
  const [game, setGame] = useState<DBGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "participants" | "bank">("info");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
  }, [searchParams]);

  const refreshGame = async () => {
    const g = await api.getGame(gameId);
    setGame(g);
    setActiveGame(g);
    return g;
  };

  useEffect(() => {
    refreshGame().catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  // Pay = join + pay in one step
  const handlePayment = async () => {
    if (!game) return;

    // Validate card fields (demo mode, but looks real)
    if (game.ticket_price_rub > 0) {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 16) { setPayError("Введите номер карты"); return; }
      if (cardExpiry.length < 5) { setPayError("Введите срок действия"); return; }
      if (cardCvc.length < 3) { setPayError("Введите CVC"); return; }
    }

    setPaying(true);
    setPayError("");
    try {
      await api.payForGame(game.id);
      setShowPayment(false);
      setCardNumber(""); setCardExpiry(""); setCardCvc("");
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
      await refreshGame();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Ошибка оплаты");
    } finally {
      setPaying(false);
    }
  };

  // Buy participation (for free games -- no card form needed)
  const handleBuyFree = async () => {
    if (!game) return;
    setPaying(true);
    try {
      await api.payForGame(game.id);
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
      await refreshGame();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Ошибка записи");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-4">
        <p className="text-warm-400 text-center py-8">Игра не найдена</p>
      </div>
    );
  }

  const status = STATUS_MAP[game.status] || STATUS_MAP.draft;
  const date = new Date(game.event_date);
  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const participants = game.participants || [];
  const myParticipant = user ? participants.find((p) => p.user_id === user.id) : null;
  const isPaid = myParticipant?.paid || false;
  const isCheckedIn = myParticipant?.checked_in || false;
  const isAdmin = user && (user.role === "admin" || user.role === "organizer");
  const canBuy = !myParticipant && (game.status === "open" || game.status === "active") && user;
  const needsPayment = myParticipant && !isPaid;

  return (
    <div className="p-4 space-y-5">
      <Link href="/games" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> Назад к играм
      </Link>

      {paymentSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Оплата прошла успешно</p>
            <p className="text-xs text-emerald-500">На мероприятии отсканируйте QR-код игры для check-in</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {game.ticket_price_rub > 0 && (
            <Badge variant="amber">{formatRubles(game.ticket_price_rub)}</Badge>
          )}
        </div>
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">{game.title}</h1>
        {game.description && <p className="text-sm text-warm-400">{game.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Calendar className="w-4 h-4" />, label: dateStr, sub: timeStr },
          { icon: <MapPin className="w-4 h-4" />, label: game.location || "Не указано", sub: "" },
          { icon: <Users className="w-4 h-4" />, label: `${participants.length}${game.max_participants ? `/${game.max_participants}` : ""}`, sub: "участников" },
          { icon: <Clock className="w-4 h-4" />, label: `${Math.round(game.pitch_duration_sec / 60)} мин`, sub: "питч" },
        ].map((info, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-warm-200/40 shadow-card">
            <div className="text-warm-400 mb-2">{info.icon}</div>
            <div className="text-sm font-medium text-warm-700">{info.label}</div>
            {info.sub && <div className="text-xs text-warm-400">{info.sub}</div>}
          </div>
        ))}
      </div>

      {/* Status card: participant flow */}
      {isCheckedIn && (
        <Card className="bg-emerald-50 border-emerald-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-warm-700">Вы в игре</div>
              <div className="text-xs text-warm-400">Check-in пройден. Добро пожаловать!</div>
            </div>
          </div>
        </Card>
      )}

      {isPaid && !isCheckedIn && (
        <Card className="bg-sky-50 border-sky-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-sky-100 text-sky-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-warm-700">Оплачено</div>
              <div className="text-xs text-warm-400">На мероприятии отсканируйте QR-код игры для check-in</div>
            </div>
          </div>
        </Card>
      )}

      {needsPayment && (
        <Card className="bg-amber-50 border-amber-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-warm-700">Ожидается оплата</div>
              <div className="text-xs text-warm-400">Оплатите билет: {formatRubles(game.ticket_price_rub)}</div>
            </div>
            <Button size="sm" onClick={() => game.ticket_price_rub > 0 ? setShowPayment(true) : handleBuyFree()}>
              Оплатить
            </Button>
          </div>
        </Card>
      )}

      {/* Buy participation button (not a participant yet) */}
      {canBuy && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60">
          <div className="text-center space-y-3">
            <p className="text-sm text-warm-600">Записывайтесь на игру и обменивайтесь услугами</p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => game.ticket_price_rub > 0 ? setShowPayment(true) : handleBuyFree()}
              disabled={paying}
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {game.ticket_price_rub > 0
                ? `Купить участие · ${formatRubles(game.ticket_price_rub)}`
                : "Записаться бесплатно"
              }
            </Button>
            {payError && <p className="text-xs text-red-500">{payError}</p>}
          </div>
        </Card>
      )}

      {/* Quick links for checked-in participants */}
      {isCheckedIn && (
        <div className="grid grid-cols-2 gap-3">
          {(game.status === "active" || game.pitch_session) && (
            <Link href="/pitch">
              <Card hover className="bg-violet-50 border-violet-200/60 h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <Mic className="w-5 h-5 text-violet-600" />
                  <span className="text-sm font-medium text-violet-800">Питч</span>
                  {game.pitch_session?.status === "active" && <Badge variant="amber">Live</Badge>}
                </div>
              </Card>
            </Link>
          )}
          <Link href="/catalog">
            <Card hover className="bg-amber-50 border-amber-200/60 h-full">
              <div className="flex flex-col items-center text-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Каталог</span>
              </div>
            </Card>
          </Link>
          {game.bank_open && (
            <Link href="/bank">
              <Card hover className="bg-emerald-50 border-emerald-200/60 h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Банк</span>
                  <Badge variant="sage">Открыт</Badge>
                </div>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Organizer/admin link to dashboard */}
      {isAdmin && (
        <Link href="/dashboard">
          <Card hover className="bg-gradient-to-r from-warm-50 to-warm-100 border-warm-200/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-warm-200 flex items-center justify-center text-warm-600">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-warm-800">Панель управления</CardTitle>
                <p className="text-xs text-warm-400 mt-0.5">Управление игрой, питч, банк</p>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1">
        {(["info", "participants", "bank"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t ? "bg-white text-warm-800 shadow-card" : "text-warm-400 hover:text-warm-600"
            }`}
          >
            {t === "info" ? "Инфо" : t === "participants" ? "Участники" : "Банк"}
          </button>
        ))}
      </div>

      {tab === "participants" && (
        <Card padding="sm" className="divide-y divide-warm-100">
          {participants.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-4">Участников пока нет</p>
          ) : (
            participants.map((p) => {
              const name = p.user
                ? `${p.user.first_name}${p.user.last_name ? ` ${p.user.last_name}` : ""}`
                : "Участник";
              return (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <Avatar name={name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-warm-700">{name}</span>
                      {p.checked_in && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {p.paid && !p.checked_in && <CreditCard className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div className="text-xs text-warm-400 truncate">
                      {p.checked_in ? "В игре" : p.paid ? "Оплачено" : "Записан"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-warm-700">{formatBarters(p.balance_b)}</div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {tab === "bank" && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-amber flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <CardTitle>Банк игры</CardTitle>
              {game.bank_open ? (
                <Badge variant="sage" className="ml-auto">Открыт</Badge>
              ) : (
                <Badge variant="default" className="ml-auto">Закрыт</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-warm-400 mb-1">Участников</div>
                <div className="font-display font-bold text-lg text-warm-800">{participants.length}</div>
              </div>
              <div>
                <div className="text-xs text-warm-400 mb-1">В обороте</div>
                <div className="font-display font-bold text-lg text-brand-amber">
                  {formatBarters(participants.reduce((s, p) => s + Number(p.balance_b), 0))}
                </div>
              </div>
            </div>
          </Card>
          {isCheckedIn && game.bank_open && (
            <Link href="/bank">
              <Button className="w-full">
                <ArrowRightLeft className="w-4 h-4" />
                Перейти в банк
              </Button>
            </Link>
          )}
        </div>
      )}

      {tab === "info" && (
        <Card>
          <h3 className="font-semibold text-warm-700 mb-2">Правила</h3>
          <ul className="space-y-2 text-sm text-warm-500">
            <li>Курс банка: 1 000 Р = 10 000 Бартеров</li>
            <li>Каждая сделка фиксируется сертификатом</li>
            <li>Бартеры остаются на балансе после игры</li>
            <li>Споры решаются по ГК РФ</li>
          </ul>
        </Card>
      )}

      {/* Payment modal */}
      {showPayment && game && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg text-warm-800">Оплата участия</h3>
              <button onClick={() => { setShowPayment(false); setPayError(""); }} className="text-warm-400 hover:text-warm-600">
                &times;
              </button>
            </div>

            <div className="bg-warm-50 rounded-2xl p-4 mb-6">
              <div className="text-xs text-warm-400 mb-1">К оплате</div>
              <div className="font-display font-bold text-2xl text-warm-800">{formatRubles(game.ticket_price_rub)}</div>
              <div className="text-xs text-warm-400 mt-1">{game.title}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">Номер карты</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-warm-500 mb-1.5">Срок</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="ММ/ГГ"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-500 mb-1.5">CVC</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="***"
                    maxLength={3}
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                  />
                </div>
              </div>
            </div>

            {payError && (
              <div className="mt-4 flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5" />
                {payError}
              </div>
            )}

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handlePayment}
              disabled={paying}
            >
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                `Оплатить ${formatRubles(game.ticket_price_rub)}`
              )}
            </Button>

            <p className="text-[10px] text-warm-300 text-center mt-3">
              Демо-режим. Карточные данные не сохраняются.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
