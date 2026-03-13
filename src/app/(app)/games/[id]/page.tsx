"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBGame } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { formatBarters } from "@/lib/utils";
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
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const STATUS_MAP: Record<string, { label: string; variant: "sage" | "outline" | "amber" | "default" }> = {
  open: { label: "Открыта", variant: "sage" },
  draft: { label: "Скоро", variant: "outline" },
  active: { label: "Идёт", variant: "amber" },
  done: { label: "Завершена", variant: "default" },
  archive: { label: "Архив", variant: "default" },
};

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.id as string;
  const { user } = useAuth();
  const { setActiveGame } = useGame();
  const [game, setGame] = useState<DBGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "participants" | "bank">("info");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.getGame(gameId)
      .then((g) => {
        setGame(g);
        setActiveGame(g);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId, setActiveGame]);

  const handleJoin = async () => {
    if (!user || !game) return;
    setJoining(true);
    try {
      await api.joinGame(game.id);
      const updated = await api.getGame(game.id);
      setGame(updated);
      setActiveGame(updated);
    } catch (err) {
      console.error("Join error:", err);
    } finally {
      setJoining(false);
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
  const isParticipant = user && participants.some((p) => p.user_id === user.id);

  return (
    <div className="p-4 space-y-5">
      <Link href="/games" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> Назад к играм
      </Link>

      <div>
        <Badge variant={status.variant} className="mb-2">{status.label}</Badge>
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">{game.title}</h1>
        {game.description && <p className="text-sm text-warm-400">{game.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Calendar className="w-4 h-4" />, label: dateStr, sub: timeStr },
          { icon: <MapPin className="w-4 h-4" />, label: game.location || "Не указано", sub: "" },
          { icon: <Users className="w-4 h-4" />, label: `${participants.length}${game.max_participants ? `/${game.max_participants}` : ""}`, sub: "участников" },
          { icon: <Clock className="w-4 h-4" />, label: `${game.pitch_duration_sec} сек`, sub: "питч" },
        ].map((info, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-warm-200/40 shadow-card">
            <div className="text-warm-400 mb-2">{info.icon}</div>
            <div className="text-sm font-medium text-warm-700">{info.label}</div>
            {info.sub && <div className="text-xs text-warm-400">{info.sub}</div>}
          </div>
        ))}
      </div>

      {(game.status === "active" || game.pitch_session) && (
        <Link href="/pitch">
          <Card hover className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-violet-800">Питч-сессия</CardTitle>
                <p className="text-xs text-violet-400 mt-0.5">Выступления участников с таймером</p>
              </div>
              {game.pitch_session?.status === "active" && (
                <Badge variant="amber">Активна</Badge>
              )}
            </div>
          </Card>
        </Link>
      )}

      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1">
        {(["info", "participants", "bank"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t
                ? "bg-white text-warm-800 shadow-card"
                : "text-warm-400 hover:text-warm-600"
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
                    <div className="text-sm font-medium text-warm-700">{name}</div>
                    <div className="text-xs text-warm-400 truncate">{p.user?.about || ""}</div>
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
          <div className="flex gap-3">
            <Button className="flex-1">
              <ArrowRightLeft className="w-4 h-4" />
              Купить Б
            </Button>
            <Button variant="outline" className="flex-1">
              Продать Б
            </Button>
          </div>
        </div>
      )}

      {tab === "info" && (
        <div className="space-y-3">
          <Card>
            <h3 className="font-semibold text-warm-700 mb-2">Правила</h3>
            <ul className="space-y-2 text-sm text-warm-500">
              <li>Курс банка: 1 000 Р = 10 000 Бартеров</li>
              <li>Каждая сделка фиксируется сертификатом</li>
              <li>Остаток Бартеров возвращается в конце игры</li>
              <li>Споры решаются по ГК РФ</li>
            </ul>
          </Card>
          {!isParticipant && game.status === "open" && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Записаться на игру"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
