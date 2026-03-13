"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, type DBGame } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { formatRubles } from "@/lib/utils";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_MAP = {
  open: { label: "Открыта", variant: "sage" as const },
  draft: { label: "Скоро", variant: "outline" as const },
  active: { label: "Идёт", variant: "amber" as const },
  done: { label: "Завершена", variant: "default" as const },
  archive: { label: "Архив", variant: "default" as const },
};

interface CreateGameForm {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  eventTime: string;
  maxParticipants: string;
  pitchDurationMin: string;
  ticketPriceRub: string;
}

const INITIAL_FORM: CreateGameForm = {
  title: "",
  description: "",
  location: "",
  eventDate: "",
  eventTime: "19:00",
  maxParticipants: "",
  pitchDurationMin: "2",
  ticketPriceRub: "",
};

export default function GamesPage() {
  const [games, setGames] = useState<DBGame[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveGame } = useGame();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateGameForm>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const canCreate = user && (user.role === "manager" || user.role === "admin");

  useEffect(() => {
    api.getGames()
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      await api.joinGame(gameId);
      const updated = await api.getGames();
      setGames(updated);
    } catch (err) {
      console.error("Join error:", err);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.eventDate) return;
    setCreating(true);
    setCreateError("");
    try {
      const dateTime = `${form.eventDate}T${form.eventTime || "19:00"}:00`;
      await api.createGame({
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        eventDate: dateTime,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
        pitchDurationSec: (parseFloat(form.pitchDurationMin) || 2) * 60,
        ticketPriceRub: form.ticketPriceRub ? parseInt(form.ticketPriceRub) : 0,
      } as unknown as Partial<DBGame>);
      setShowForm(false);
      setForm(INITIAL_FORM);
      const updated = await api.getGames();
      setGames(updated);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Ошибка создания");
    } finally {
      setCreating(false);
    }
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Игры</h1>
          <p className="text-sm text-warm-400">Расписание мероприятий клуба</p>
        </div>
        {canCreate && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Создать
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-warm-800">Новая игра</h2>
            <button onClick={() => { setShowForm(false); setCreateError(""); }} className="text-warm-400 hover:text-warm-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-warm-500 mb-1">Название *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Бартерия #12"
                className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-500 mb-1">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Формат, тема, что ожидать..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-500 mb-1">Место</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Коворкинг, ул. Примерная, 1"
                className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1">Дата *</label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1">Время</label>
                <input
                  type="time"
                  value={form.eventTime}
                  onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1">Макс. уч.</label>
                <input
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                  placeholder="20"
                  min="2"
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1">Питч, мин</label>
                <input
                  type="number"
                  value={form.pitchDurationMin}
                  onChange={(e) => setForm({ ...form, pitchDurationMin: e.target.value })}
                  placeholder="2"
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1">Билет, руб</label>
                <input
                  type="number"
                  value={form.ticketPriceRub}
                  onChange={(e) => setForm({ ...form, ticketPriceRub: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
            </div>
          </div>

          {createError && (
            <p className="text-xs text-brand-coral">{createError}</p>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={creating || !form.title.trim() || !form.eventDate}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Создать игру
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setCreateError(""); }}>
              Отмена
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4 stagger-children">
        {games.map((game) => {
          const status = STATUS_MAP[game.status] || STATUS_MAP.draft;
          const date = new Date(game.event_date);
          const dateStr = date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
          });
          const timeStr = date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const participantCount = game.participants?.length ?? 0;

          return (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              onClick={() => setActiveGame(game)}
            >
              <Card hover className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {game.status === "open" && game.max_participants && (
                        <span className="text-[10px] text-warm-400">
                          {participantCount}/{game.max_participants} мест
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-warm-800 text-lg">
                      {game.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-warm-300 group-hover:text-brand-amber transition-colors shrink-0 mt-1" />
                </div>

                {game.description && (
                  <p className="text-sm text-warm-400 mb-4">{game.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-warm-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-warm-400" />
                    {dateStr}, {timeStr}
                  </div>
                  {game.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-warm-400" />
                      {game.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-warm-400" />
                    {participantCount} уч.
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-warm-400" />
                    Питч {game.pitch_duration_sec / 60} мин
                  </div>
                </div>

                {game.status === "open" && (
                  <div className="mt-4">
                    {game.max_participants && (
                      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-brand-amber rounded-full transition-all"
                          style={{ width: `${(participantCount / game.max_participants) * 100}%` }}
                        />
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => handleJoin(e, game.id)}
                    >
                      Записаться{game.ticket_price_rub > 0 ? ` · ${formatRubles(game.ticket_price_rub)}` : ""}
                    </Button>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}

        {games.length === 0 && (
          <Card>
            <p className="text-sm text-warm-400 text-center py-4">Игр пока нет</p>
          </Card>
        )}
      </div>
    </div>
  );
}
