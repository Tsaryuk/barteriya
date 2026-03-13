"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api, type DashboardData, type DBTransaction, type DBParticipant, type DBGame } from "@/lib/api";
import { useSupabaseSubscription } from "@/hooks/use-realtime";
import { formatBarters, formatRubles, formatTimeAgo } from "@/lib/utils";
import {
  ArrowRightLeft,
  Users,
  Handshake,
  TrendingUp,
  Landmark,
  Trophy,
  Mic,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  X,
  BarChart3,
  Zap,
  Loader2,
  Play,
  SkipForward,
  Square,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export default function DashboardPage() {
  const [games, setGames] = useState<DBGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPitch, setShowPitch] = useState(false);
  const [clock, setClock] = useState(new Date());

  // Load game list
  useEffect(() => {
    api.getGames()
      .then((g) => {
        setGames(g);
        const active = g.find((x) => x.status === "active") || g[0];
        if (active) setSelectedGameId(active.id);
      })
      .catch(() => setError("Не удалось загрузить игры"));
  }, []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(() => {
    if (!selectedGameId) return;
    api.getDashboard(selectedGameId)
      .then((d) => { setData(d); setError(null); })
      .catch(() => setError("Не удалось загрузить дашборд"))
      .finally(() => setLoading(false));
  }, [selectedGameId]);

  useEffect(() => {
    if (!selectedGameId) return;
    setLoading(true);
    fetchDashboard();
  }, [selectedGameId, fetchDashboard]);

  // Realtime: refresh on any change
  useSupabaseSubscription(
    `dashboard-${selectedGameId}`,
    [
      { table: "transactions", event: "*", filter: selectedGameId ? `game_id=eq.${selectedGameId}` : undefined, callback: () => fetchDashboard() },
      { table: "game_participants", event: "*", filter: selectedGameId ? `game_id=eq.${selectedGameId}` : undefined, callback: () => fetchDashboard() },
      { table: "pitch_sessions", event: "*", filter: selectedGameId ? `game_id=eq.${selectedGameId}` : undefined, callback: () => fetchDashboard() },
      { table: "games", event: "UPDATE", filter: selectedGameId ? `id=eq.${selectedGameId}` : undefined, callback: () => fetchDashboard() },
      { table: "purchased_certificates", event: "*", filter: selectedGameId ? `game_id=eq.${selectedGameId}` : undefined, callback: () => fetchDashboard() },
    ],
    !!selectedGameId
  );

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-noise">
        <Loader2 className="w-8 h-8 text-brand-amber animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-noise">
        <div className="text-center">
          <p className="text-warm-500 mb-4">{error || "Нет данных"}</p>
          <Button onClick={fetchDashboard}>Повторить</Button>
        </div>
      </div>
    );
  }

  const { game, stats, participants, transactions, pitchSession, pitchQueue } = data;

  const gameElapsed = Math.floor(
    (Date.now() - new Date(game.event_date).getTime()) / 60000
  );
  const gameHours = Math.floor(Math.max(0, gameElapsed) / 60);
  const gameMins = Math.max(0, gameElapsed) % 60;

  if (showPitch) {
    return (
      <PitchOverlay
        onClose={() => setShowPitch(false)}
        pitchSession={pitchSession}
        pitchQueue={pitchQueue}
        pitchDuration={game.pitch_duration_sec}
        gameId={game.id}
        gameStatus={game.status}
        onRefresh={fetchDashboard}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-noise">
      {/* Top bar */}
      <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-warm-200/40 px-6 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-amber flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </div>
          {games.length > 1 ? (
            <select
              value={selectedGameId || ""}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="font-display font-semibold text-warm-800 text-lg bg-transparent border-none outline-none cursor-pointer"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          ) : (
            <span className="font-display font-semibold text-warm-800 text-lg">
              {game.title}
            </span>
          )}
          <GameStatusBadge status={game.status} />
        </div>

        <div className="flex items-center gap-4">
          <GameStatusControl gameId={game.id} status={game.status} onRefresh={fetchDashboard} />

          <BankToggle gameId={game.id} bankOpen={game.bank_open} onRefresh={fetchDashboard} />

          <button
            onClick={() => setShowPitch(true)}
            className="flex items-center gap-2 bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
          >
            <Mic className="w-4 h-4" />
            Питч-сессия
          </button>

          <div className="text-right">
            <div className="font-display font-semibold text-warm-700 tabular-nums">
              {clock.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-[10px] text-warm-400">
              {gameElapsed > 0 ? `Игра идёт ${gameHours}:${gameMins.toString().padStart(2, "0")}` : "Игра не началась"}
            </div>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 p-4 grid grid-cols-12 grid-rows-6 gap-4 overflow-hidden relative z-10">
        {/* Row 1: Key metrics */}
        <StatCard
          className="col-span-3 row-span-1"
          icon={<Users className="w-5 h-5" />}
          label="Участники"
          value={stats.totalParticipants.toString()}
          iconColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          className="col-span-3 row-span-1"
          icon={<Handshake className="w-5 h-5" />}
          label="Сделки"
          value={stats.totalDeals.toString()}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          className="col-span-3 row-span-1"
          icon={<TrendingUp className="w-5 h-5" />}
          label="Сделок / мин"
          value={stats.dealsPerMinute.toFixed(1)}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          className="col-span-3 row-span-1"
          icon={<Zap className="w-5 h-5" />}
          label="Средняя сделка"
          value={formatBarters(stats.avgDealSize)}
          iconColor="bg-violet-50 text-violet-600"
        />

        {/* Row 2: Bank summary */}
        <div className="col-span-6 row-span-2">
          <Card className="h-full bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/40">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-brand-amber" />
              <CardTitle className="text-base">Состояние банка</CardTitle>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-warm-400 mb-1">Принято ₽</div>
                <div className="font-display font-bold text-xl text-warm-800">
                  {formatRubles(stats.totalBankIn)}
                </div>
              </div>
              <div>
                <div className="text-xs text-warm-400 mb-1">Выдано ₽</div>
                <div className="font-display font-bold text-xl text-warm-800">
                  {formatRubles(stats.totalBankOut)}
                </div>
              </div>
              <div>
                <div className="text-xs text-warm-400 mb-1">В обороте</div>
                <div className="font-display font-bold text-xl text-brand-amber">
                  {formatBarters(stats.totalBartersInCirculation)}
                </div>
              </div>
            </div>
            {stats.totalBankIn > 0 && (
              <div>
                <div className="flex justify-between text-xs text-warm-400 mb-1.5">
                  <span>Израсходовано</span>
                  <span>{Math.round((stats.totalBankOut / stats.totalBankIn) * 100)}%</span>
                </div>
                <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-amber to-brand-gold rounded-full transition-all"
                    style={{ width: `${(stats.totalBankOut / stats.totalBankIn) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-amber-200/40 flex items-center justify-between">
              <span className="text-sm text-warm-500">Текущий курс</span>
              <span className="font-display font-semibold text-brand-amber">1 000 ₽ = 10 000 Б</span>
            </div>
          </Card>
        </div>

        {/* Certificates donut */}
        <div className="col-span-3 row-span-2">
          <Card className="h-full flex flex-col">
            <CardTitle className="text-base mb-4">Сертификаты</CardTitle>
            <div className="flex-1 flex items-center justify-center">
              <CertDonut data={stats.certsByStatus} />
            </div>
          </Card>
        </div>

        {/* Top by volume */}
        <div className="col-span-3 row-span-2">
          <Card className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Топ по балансу</CardTitle>
            </div>
            <div className="space-y-3">
              {participants.slice(0, 5).map((p, i) => {
                const name = getParticipantName(p);
                const maxBalance = participants[0]?.balance_b || 1;
                return (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-warm-50 text-warm-400"
                    }`}>
                      {i + 1}
                    </div>
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-warm-700 truncate">{name}</div>
                      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-brand-amber rounded-full"
                          style={{ width: `${(p.balance_b / maxBalance) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-warm-600 shrink-0">{formatBarters(p.balance_b)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Activity — placeholder for now (no time-series data from API yet) */}
        <div className="col-span-5 row-span-3">
          <Card className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-brand-amber" />
              <CardTitle className="text-base">Лента сделок</CardTitle>
              <span className="text-xs text-warm-400 ml-auto">{transactions.length} последних</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {transactions.length === 0 ? (
                <p className="text-sm text-warm-400 text-center py-8">Сделок пока нет</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-cream-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "bank_in" ? "bg-emerald-50 text-emerald-500" :
                      tx.type === "bank_out" ? "bg-amber-50 text-amber-500" :
                      "bg-sky-50 text-sky-500"
                    }`}>
                      {tx.type === "bank_in" ? <ArrowDownLeft className="w-3.5 h-3.5" /> :
                       tx.type === "bank_out" ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                       <ArrowRightLeft className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-warm-700 truncate">
                        {getTxLabel(tx)}
                      </div>
                      <div className="text-[10px] text-warm-400 truncate">{tx.note}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-warm-600">{formatBarters(tx.amount_b)}</div>
                      <div className="text-[10px] text-warm-400">{formatTimeAgo(new Date(tx.created_at))}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Participants table */}
        <div className="col-span-3 row-span-3">
          <Card className="h-full overflow-hidden flex flex-col" padding="sm">
            <div className="px-3 pt-2 pb-3">
              <CardTitle className="text-base">Участники ({participants.length})</CardTitle>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-warm-100">
              {participants.map((p) => {
                const name = getParticipantName(p);
                return (
                  <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-warm-700 truncate">{name}</div>
                      <div className="text-[10px] text-warm-400 truncate">
                        {(p.user as Record<string, unknown>)?.about as string || ""}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-warm-600">{formatBarters(p.balance_b)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Pitch status mini */}
        <div className="col-span-4 row-span-3">
          <Card className="h-full overflow-hidden flex flex-col" padding="sm">
            <div className="flex items-center gap-2 px-3 pt-2 pb-3">
              <Mic className="w-4 h-4 text-violet-500" />
              <CardTitle className="text-base">Питч-сессия</CardTitle>
              {pitchSession && pitchSession.status === "active" && (
                <Badge variant="sage" className="ml-auto">
                  <div className="live-dot mr-1.5 scale-75" />
                  LIVE
                </Badge>
              )}
            </div>
            {!pitchSession ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-warm-400">Питч ещё не начат</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1 px-1">
                {pitchQueue.map((p) => {
                  const name = getParticipantName(p);
                  const isActive = pitchSession.current_speaker_id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${
                        isActive ? "bg-violet-50 border border-violet-200" :
                        p.pitch_status === "done" ? "bg-brand-sage-light/30" :
                        "hover:bg-cream-50"
                      }`}
                    >
                      <div className="w-5 text-center text-xs text-warm-400">{p.pitch_order}</div>
                      <Avatar name={name} size="sm" />
                      <span className={`text-xs font-medium flex-1 truncate ${
                        isActive ? "text-violet-700" :
                        p.pitch_status === "done" ? "text-brand-sage" :
                        "text-warm-600"
                      }`}>{name}</span>
                      {p.pitch_status === "done" && <Check className="w-3.5 h-3.5 text-brand-sage" />}
                      {isActive && <Mic className="w-3.5 h-3.5 text-violet-500" />}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────── */

function getParticipantName(p: DBParticipant): string {
  const u = p.user as Record<string, unknown> | undefined;
  if (!u) return "Участник";
  return `${u.first_name || ""}${u.last_name ? ` ${u.last_name}` : ""}`.trim() || "Участник";
}

function getTxLabel(tx: DBTransaction): string {
  const fromName = tx.from_user ? `${tx.from_user.first_name}${tx.from_user.last_name ? ` ${tx.from_user.last_name}` : ""}` : "Банк";
  const toName = tx.to_user ? `${tx.to_user.first_name}${tx.to_user.last_name ? ` ${tx.to_user.last_name}` : ""}` : "Банк";
  if (tx.type === "transfer") return `${fromName} → ${toName}`;
  if (tx.type === "bank_in") return `Банк → ${toName}`;
  return `${fromName} → Банк`;
}

/* ─── Game Status Control ─────────────────────────── */

function GameStatusBadge({ status }: { status: string }) {
  const isLive = status === "active";
  const map: Record<string, { label: string; variant: "amber" | "sage" | "default" }> = {
    draft: { label: "Черновик", variant: "default" },
    open: { label: "Открыта", variant: "amber" },
    active: { label: "LIVE", variant: "sage" },
    done: { label: "Завершена", variant: "default" },
    archive: { label: "Архив", variant: "default" },
  };
  const info = map[status] || { label: status, variant: "default" as const };
  return (
    <Badge variant={info.variant} className="ml-1">
      {isLive && <div className="live-dot mr-1.5 scale-75" />}
      {info.label}
    </Badge>
  );
}

function GameStatusControl({
  gameId,
  status,
  onRefresh,
}: {
  gameId: string;
  status: string;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const transitions: Record<string, { label: string; next: string }> = {
    draft: { label: "Открыть регистрацию", next: "open" },
    open: { label: "Начать игру", next: "active" },
    active: { label: "Завершить игру", next: "done" },
  };

  const transition = transitions[status];
  if (!transition) return null;

  const handleTransition = async () => {
    setUpdating(true);
    try {
      await api.updateGame(gameId, { status: transition.next } as Partial<DBGame>);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  return (
    <button
      onClick={handleTransition}
      disabled={updating}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
        status === "active"
          ? "bg-red-100 hover:bg-red-200 text-red-700"
          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
      }`}
    >
      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> :
       status === "active" ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {transition.label}
    </button>
  );
}

/* ─── Stat Card ──────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  iconColor,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Card className="h-full flex items-center gap-3" padding="sm">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-warm-400">{label}</div>
          <div className="font-display font-bold text-lg text-warm-800">{value}</div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Cert Donut ─────────────────────────────────── */

function CertDonut({ data }: { data: { active: number; redeemed: number; expired: number } }) {
  const total = data.active + data.redeemed + data.expired;
  if (total === 0) {
    return <p className="text-sm text-warm-400">Нет сертификатов</p>;
  }
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const segments = [
    { value: data.redeemed, color: "#4DAA6D", label: "Погашены" },
    { value: data.active, color: "#E8960C", label: "Активны" },
    { value: data.expired, color: "#E8E2D6", label: "Истекли" },
  ];

  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
        {segments.map((seg) => {
          const len = (seg.value / total) * circumference;
          const dashOffset = offset;
          offset += len;
          return (
            <circle
              key={seg.label}
              cx="60" cy="60" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="butt"
            />
          );
        })}
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          className="fill-warm-800 font-display font-bold"
          fontSize="20" transform="rotate(90 60 60)">
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-warm-500">{seg.label}</span>
            <span className="text-xs font-semibold text-warm-700">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pitch Overlay ──────────────────────────────── */

function PitchOverlay({
  onClose,
  pitchSession,
  pitchQueue,
  pitchDuration,
  gameId,
  gameStatus,
  onRefresh,
}: {
  onClose: () => void;
  pitchSession: DashboardData["pitchSession"];
  pitchQueue: DBParticipant[];
  pitchDuration: number;
  gameId: string;
  gameStatus: string;
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartPitch = async () => {
    setActionLoading(true);
    try {
      await api.startPitch(gameId);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextSpeaker = async () => {
    setActionLoading(true);
    try {
      await api.nextPitch(gameId);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const activeSpeaker = pitchSession?.current_speaker;
  const speakerUser = activeSpeaker?.user as Record<string, unknown> | undefined;
  const speakerName = speakerUser
    ? `${speakerUser.first_name || ""}${speakerUser.last_name ? ` ${speakerUser.last_name}` : ""}`.trim()
    : null;
  const speakerAbout = (speakerUser?.about as string) || "";

  const nextWaiting = pitchQueue.find((p) => p.pitch_status === "waiting");
  const nextName = nextWaiting ? getParticipantName(nextWaiting) : null;

  return (
    <div className="h-screen bg-gradient-to-br from-violet-50 via-cream to-purple-50 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-violet-200/20 animate-float" />
        <div className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full bg-amber-200/20 animate-float-delayed" />
      </div>

      {/* Top bar */}
      <div className="h-14 px-6 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-violet-500" />
          <span className="font-display font-semibold text-warm-800">Питч-сессия</span>
          {pitchSession && pitchSession.status === "active" && (
            <Badge variant="sage">
              <div className="live-dot mr-1.5 scale-75" />
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Organizer controls */}
          {!pitchSession || pitchSession.status === "pending" ? (
            <button
              onClick={handleStartPitch}
              disabled={actionLoading || gameStatus !== "active"}
              className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Начать питч
            </button>
          ) : pitchSession.status === "active" ? (
            <button
              onClick={handleNextSpeaker}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
              Следующий
            </button>
          ) : null}

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/50 hover:bg-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-warm-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        {!pitchSession || pitchSession.status === "pending" ? (
          <div className="text-center">
            <Mic className="w-16 h-16 text-violet-300 mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-warm-700 mb-2">Питч ещё не начат</h2>
            <p className="text-warm-400">
              {pitchQueue.length} участников в очереди
            </p>
          </div>
        ) : pitchSession.status === "done" ? (
          <div className="text-center">
            <Check className="w-16 h-16 text-brand-sage mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-warm-700 mb-2">Питч завершён</h2>
            <p className="text-warm-400">Все выступили</p>
          </div>
        ) : (
          <div className="flex items-center gap-16">
            <SyncedTimer
              speakerStartedAt={pitchSession.speaker_started_at}
              pitchDuration={pitchDuration}
            />
            {speakerName && (
              <div className="text-left">
                <div className="text-sm text-warm-400 mb-2 uppercase tracking-wider">Сейчас выступает</div>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar name={speakerName} size="xl" />
                  <div>
                    <h2 className="font-display font-bold text-4xl text-warm-800">{speakerName}</h2>
                    {speakerAbout && (
                      <p className="text-warm-500 mt-1">{speakerAbout}</p>
                    )}
                  </div>
                </div>
                {nextName && (
                  <div className="text-sm text-warm-400">
                    Следующий: <span className="font-medium text-warm-600">{nextName}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom queue */}
      <div className="h-20 px-6 flex items-center gap-3 overflow-x-auto shrink-0 relative z-10">
        {pitchQueue.map((p) => {
          const name = getParticipantName(p);
          const isActive = pitchSession?.current_speaker_id === p.id;
          return (
            <div
              key={p.id}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                isActive
                  ? "bg-violet-100 border-violet-300 shadow-md"
                  : p.pitch_status === "done"
                  ? "bg-brand-sage-light border-brand-sage/20"
                  : "bg-white/60 border-warm-200/40"
              }`}
            >
              <Avatar name={name} size="sm" />
              <span className={`text-sm font-medium ${
                isActive ? "text-violet-700" :
                p.pitch_status === "done" ? "text-brand-sage" :
                "text-warm-500"
              }`}>{name}</span>
              {p.pitch_status === "done" && <Check className="w-4 h-4 text-brand-sage" />}
              {isActive && <Mic className="w-4 h-4 text-violet-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Bank Toggle ────────────────────────────────── */

function BankToggle({
  gameId,
  bankOpen,
  onRefresh,
}: {
  gameId: string;
  bankOpen: boolean;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.updateGame(gameId, { bank_open: !bankOpen } as Partial<DBGame>);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
        bankOpen
          ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
          : "bg-warm-100 hover:bg-warm-200 text-warm-500"
      }`}
    >
      {toggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Landmark className="w-4 h-4" />
      )}
      {bankOpen ? "Банк открыт" : "Банк закрыт"}
    </button>
  );
}

/* ─── Synced Timer ──────────────────────────────── */

function SyncedTimer({
  speakerStartedAt,
  pitchDuration,
}: {
  speakerStartedAt: string | null;
  pitchDuration: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!speakerStartedAt) return;
    const calcElapsed = () => {
      const started = new Date(speakerStartedAt).getTime();
      return Math.min(Math.floor((Date.now() - started) / 1000), pitchDuration);
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
  const circumference = 2 * Math.PI * 100;

  return (
    <div className="relative">
      <svg className="w-60 h-60 -rotate-90" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r="100" fill="none" stroke="#E8E2D6" strokeWidth="8" />
        <circle
          cx="110" cy="110" r="100" fill="none"
          stroke={isWarning ? "#E8614D" : "#7C3AED"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`font-display font-bold text-6xl ${isWarning ? "text-brand-coral" : "text-violet-700"}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
