"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { api, type DBPitchSession, type DBParticipant } from "@/lib/api";
import { useSupabaseSubscription } from "@/hooks/use-realtime";
import { Mic, MicOff, Check, Clock, ChevronLeft, Square, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

export default function PitchPage() {
  const { activeGame } = useGame();
  const { user } = useAuth();
  const [session, setSession] = useState<DBPitchSession | null>(null);
  const [queue, setQueue] = useState<DBParticipant[]>([]);
  const [pitchDuration, setPitchDuration] = useState(120);
  const [loading, setLoading] = useState(true);

  const gameId = activeGame?.id;

  const fetchPitch = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await api.getPitchSession(gameId);
      setSession(data.session);
      setQueue(data.queue);
      setPitchDuration(data.pitchDurationSec);
    } catch {
      // No pitch session yet
      setSession(null);
      setQueue([]);
    }
  }, [gameId]);

  useEffect(() => {
    setLoading(true);
    fetchPitch().finally(() => setLoading(false));
  }, [fetchPitch]);

  // Realtime: pitch session changes
  useSupabaseSubscription(
    `pitch-${gameId}`,
    [
      {
        table: "pitch_sessions",
        event: "UPDATE",
        filter: gameId ? `game_id=eq.${gameId}` : undefined,
        callback: () => { fetchPitch(); },
      },
      {
        table: "game_participants",
        event: "UPDATE",
        filter: gameId ? `game_id=eq.${gameId}` : undefined,
        callback: () => { fetchPitch(); },
      },
    ],
    !!gameId
  );

  const isMyTurn =
    session?.status === "active" &&
    session?.current_speaker?.user_id === user?.id;

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!activeGame) {
    return (
      <div className="p-4">
        <p className="text-warm-400 text-center py-8">Сначала выберите игру</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 space-y-5">
        <Link href={`/games/${activeGame.id}`} className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
          <ChevronLeft className="w-4 h-4" /> {activeGame.title}
        </Link>
        <Card className="text-center py-8">
          <MicOff className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-500 font-medium mb-1">Питч-сессия не запущена</p>
          <p className="text-sm text-warm-400">Организатор запустит её во время мероприятия</p>
        </Card>
      </div>
    );
  }

  if (isMyTurn) {
    return (
      <MyPitchView
        session={session}
        pitchDuration={pitchDuration}
      />
    );
  }

  return (
    <ObserverView
      session={session}
      queue={queue}
      pitchDuration={pitchDuration}
      game={activeGame}
    />
  );
}

/* ─── Observer View ──────────────────────────────────── */

function ObserverView({
  session,
  queue,
  pitchDuration,
  game,
}: {
  session: DBPitchSession;
  queue: DBParticipant[];
  pitchDuration: number;
  game: { id: string; title: string };
}) {
  const speaker = session.current_speaker;
  const speakerName = speaker?.user
    ? `${speaker.user.first_name}${speaker.user.last_name ? ` ${speaker.user.last_name}` : ""}`
    : null;

  return (
    <div className="p-4 space-y-5">
      <Link href={`/games/${game.id}`} className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> {game.title}
      </Link>

      <div className="flex items-center gap-2">
        <Mic className="w-5 h-5 text-violet-500" />
        <h1 className="font-display font-bold text-2xl text-warm-800">Питч-сессия</h1>
        <Badge variant={session.status === "active" ? "sage" : session.status === "done" ? "default" : "amber"}>
          {session.status === "active" ? "Активна" : session.status === "done" ? "Завершена" : "Пауза"}
        </Badge>
      </div>

      {/* Current speaker */}
      {session.status === "active" && speaker && speakerName && (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/60 text-center">
          <div className="text-xs text-violet-400 mb-3 uppercase tracking-wider">Сейчас выступает</div>
          <Avatar name={speakerName} size="xl" className="mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-warm-800 mb-2">{speakerName}</h3>
          {speaker.user?.about && (
            <p className="text-sm text-warm-400 mb-4">{speaker.user.about}</p>
          )}
          <SyncedTimer
            speakerStartedAt={session.speaker_started_at}
            pitchDuration={pitchDuration}
            size="sm"
          />
        </Card>
      )}

      {session.status === "done" && (
        <Card className="text-center py-6">
          <Check className="w-10 h-10 text-brand-sage mx-auto mb-2" />
          <p className="text-warm-600 font-medium">Питч-сессия завершена</p>
          <p className="text-sm text-warm-400 mt-1">Время заключать сделки!</p>
        </Card>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-warm-700 mb-3">Очередь</h2>
          <Card padding="sm" className="divide-y divide-warm-100">
            {queue.map((p) => {
              const name = p.user
                ? `${p.user.first_name}${p.user.last_name ? ` ${p.user.last_name}` : ""}`
                : "Участник";
              return (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-warm-100 text-warm-400 shrink-0">
                    {p.pitch_order}
                  </div>
                  <Avatar name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-warm-700">{name}</div>
                    <div className="text-xs text-warm-400 truncate">{p.user?.about || ""}</div>
                  </div>
                  <div className="shrink-0">
                    {p.pitch_status === "done" && (
                      <div className="w-6 h-6 rounded-full bg-brand-sage-light flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-brand-sage" />
                      </div>
                    )}
                    {p.pitch_status === "active" && (
                      <Badge variant="amber" className="text-[10px]">Сейчас</Badge>
                    )}
                    {p.pitch_status === "waiting" && (
                      <Clock className="w-4 h-4 text-warm-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── My Pitch View ──────────────────────────────────── */

function MyPitchView({
  session,
  pitchDuration,
}: {
  session: DBPitchSession;
  pitchDuration: number;
}) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="text-xs text-violet-400 mb-4 uppercase tracking-wider">Ваш питч</div>
        <SyncedTimer
          speakerStartedAt={session.speaker_started_at}
          pitchDuration={pitchDuration}
          size="lg"
        />
        <p className="text-warm-400 mt-6 text-sm">Рассказывайте о своих услугах!</p>
        <Link href="/transfer" className="inline-block mt-8">
          <Button variant="outline">
            <Square className="w-4 h-4" />
            Перейти к сделкам
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Synced Timer ────────────────────────────────────── */

function SyncedTimer({
  speakerStartedAt,
  pitchDuration,
  size = "sm",
}: {
  speakerStartedAt: string | null;
  pitchDuration: number;
  size?: "sm" | "lg";
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!speakerStartedAt) return;

    const calcElapsed = () => {
      const started = new Date(speakerStartedAt).getTime();
      const now = Date.now();
      return Math.min(Math.floor((now - started) / 1000), pitchDuration);
    };

    setElapsed(calcElapsed());
    const interval = setInterval(() => setElapsed(calcElapsed()), 1000);
    return () => clearInterval(interval);
  }, [speakerStartedAt, pitchDuration]);

  const remaining = pitchDuration - elapsed;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = (elapsed / pitchDuration) * 100;
  const isWarning = remaining <= 30;

  const svgSize = size === "lg" ? 240 : 96;
  const radius = size === "lg" ? 110 : 42;
  const strokeWidth = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const center = svgSize / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`${size === "lg" ? "w-60 h-60" : "w-24 h-24"} -rotate-90`} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E8E2D6" strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={isWarning ? "#E8614D" : size === "lg" ? "#E8960C" : "#7C3AED"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-display font-bold ${
          size === "lg" ? "text-5xl" : "text-xl"
        } ${isWarning ? "text-brand-coral" : size === "lg" ? "text-warm-800" : "text-violet-700"} ${
          isWarning && size === "lg" ? "animate-pulse-warm" : ""
        }`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
        {size === "lg" && <div className="text-xs text-warm-400 mt-1">осталось</div>}
      </div>
    </div>
  );
}
