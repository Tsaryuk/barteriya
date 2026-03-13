"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, type DBGame } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Loader2,
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

export default function GamesPage() {
  const [games, setGames] = useState<DBGame[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveGame } = useGame();
  const { user } = useAuth();

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
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Игры</h1>
        <p className="text-sm text-warm-400">Расписание мероприятий клуба</p>
      </div>

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

                {game.status === "open" && game.max_participants && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-brand-amber rounded-full transition-all"
                        style={{ width: `${(participantCount / game.max_participants) * 100}%` }}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => handleJoin(e, game.id)}
                    >
                      Записаться на игру
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
