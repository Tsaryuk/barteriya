"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { api, type DBGame } from "@/lib/api";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { formatBarters, formatRubles } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import {
  Users,
  CreditCard,
  CheckCircle,
  Play,
  SkipForward,
  Mic,
  Landmark,
  Loader2,
  ChevronLeft,
  AlertCircle,
  ArrowRightLeft,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface DashboardStats {
  totalParticipants: number;
  paidCount: number;
  checkedInCount: number;
  totalDeals: number;
  totalBankIn: number;
  totalBankOut: number;
  totalBartersInCirculation: number;
  dealsPerMinute: number;
  avgDealSize: number;
  certsByStatus: { active: number; redeemed: number; expired: number };
}

interface DashboardParticipant {
  id: string;
  balance_b: number;
  pitch_order: number | null;
  pitch_status: string;
  paid: boolean;
  checked_in: boolean;
  checked_in_at: string | null;
  user: {
    id: string;
    first_name: string;
    last_name: string | null;
    username: string | null;
    about: string | null;
    photo_url: string | null;
  };
}

interface DashboardData {
  game: DBGame;
  stats: DashboardStats;
  participants: DashboardParticipant[];
  pitchSession: {
    id: string;
    status: string;
    current_speaker_id: string | null;
    speaker_started_at: string | null;
    current_speaker?: DashboardParticipant;
  } | null;
  pitchQueue: DashboardParticipant[];
}

export default function DashboardPage() {
  const { activeGame } = useGame();
  useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "participants" | "checkin">("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Deposit modal
  const [depositUserId, setDepositUserId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  const gameId = activeGame?.id;

  const refresh = useCallback(async () => {
    if (!gameId) return;
    try {
      const d = await api.getDashboard(gameId);
      setData(d as unknown as DashboardData);
    } catch {
      setError("Не удалось загрузить данные");
    }
  }, [gameId]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!gameId) return;
    handleAction(`status_${newStatus}`, () => api.updateGame(gameId, { status: newStatus } as Partial<DBGame>));
  };

  const handleBankToggle = () => {
    if (!gameId || !data) return;
    handleAction("bank", () => api.updateGame(gameId, { bank_open: !data.game.bank_open } as Partial<DBGame>));
  };

  const handleStartPitch = () => {
    if (!gameId) return;
    handleAction("pitch_start", () => api.startPitch(gameId));
  };

  const handleNextPitch = () => {
    if (!gameId) return;
    handleAction("pitch_next", () => api.nextPitch(gameId));
  };

  const handleCheckin = (userId: string) => {
    if (!gameId) return;
    handleAction(`checkin_${userId}`, () => api.checkIn(gameId, userId));
  };

  const handleDeposit = async () => {
    if (!gameId || !depositUserId || !depositAmount) return;
    setDepositing(true);
    try {
      await api.deposit(gameId, parseInt(depositAmount), depositUserId);
      setDepositUserId(null);
      setDepositAmount("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка пополнения");
    } finally {
      setDepositing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!gameId || !data) {
    return (
      <div className="p-4">
        <Link href="/games" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600 mb-4">
          <ChevronLeft className="w-4 h-4" /> Назад
        </Link>
        <p className="text-warm-400 text-center py-8">Выберите игру для управления</p>
      </div>
    );
  }

  const { game, stats, participants, pitchSession, pitchQueue } = data;
  const checkedIn = participants.filter((p) => p.checked_in);
  const paid = participants.filter((p) => p.paid);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const checkinUrl = `${appUrl}/games/${gameId}`;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/games/${gameId}`} className="inline-flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 mb-1">
            <ChevronLeft className="w-3 h-3" /> {game.title}
          </Link>
          <h1 className="font-display font-bold text-xl text-warm-800">Панель управления</h1>
        </div>
        <Badge variant={game.status === "active" ? "amber" : game.status === "open" ? "sage" : "outline"}>
          {game.status === "active" ? "Идёт" : game.status === "open" ? "Открыта" : game.status === "done" ? "Завершена" : "Черновик"}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400">&times;</button>
        </div>
      )}

      {/* Game controls */}
      <Card className="space-y-3">
        <CardTitle className="text-sm">Управление игрой</CardTitle>
        <div className="flex flex-wrap gap-2">
          {game.status === "draft" && (
            <Button size="sm" onClick={() => handleStatusChange("open")} disabled={!!actionLoading}>
              Открыть запись
            </Button>
          )}
          {game.status === "open" && (
            <Button size="sm" onClick={() => handleStatusChange("active")} disabled={!!actionLoading}>
              <Play className="w-3.5 h-3.5" /> Начать игру
            </Button>
          )}
          {game.status === "active" && (
            <>
              <Button size="sm" variant="outline" onClick={handleBankToggle} disabled={!!actionLoading}>
                <Landmark className="w-3.5 h-3.5" />
                {game.bank_open ? "Закрыть банк" : "Открыть банк"}
              </Button>
              {!pitchSession || pitchSession.status === "pending" ? (
                <Button size="sm" onClick={handleStartPitch} disabled={!!actionLoading}>
                  <Mic className="w-3.5 h-3.5" /> Старт питч
                </Button>
              ) : pitchSession.status === "active" ? (
                <Button size="sm" onClick={handleNextPitch} disabled={!!actionLoading}>
                  <SkipForward className="w-3.5 h-3.5" /> Следующий
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => handleStatusChange("done")} disabled={!!actionLoading}>
                Завершить игру
              </Button>
            </>
          )}
          {game.status === "done" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("archive")} disabled={!!actionLoading}>
              В архив
            </Button>
          )}
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 border border-warm-200/40 shadow-card text-center">
          <Users className="w-4 h-4 text-warm-400 mx-auto mb-1" />
          <div className="font-display font-bold text-lg text-warm-800">{stats.totalParticipants}</div>
          <div className="text-[10px] text-warm-400">записано</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-warm-200/40 shadow-card text-center">
          <CreditCard className="w-4 h-4 text-sky-400 mx-auto mb-1" />
          <div className="font-display font-bold text-lg text-sky-600">{stats.paidCount}</div>
          <div className="text-[10px] text-warm-400">оплатили</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-warm-200/40 shadow-card text-center">
          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="font-display font-bold text-lg text-emerald-600">{stats.checkedInCount}</div>
          <div className="text-[10px] text-warm-400">в игре</div>
        </div>
      </div>

      {/* Bank stats */}
      {game.status === "active" && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm text-amber-800">Банк</CardTitle>
            {game.bank_open ? <Badge variant="sage">Открыт</Badge> : <Badge variant="default">Закрыт</Badge>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <div className="text-warm-400">Внесено</div>
              <div className="font-bold text-warm-700">{formatRubles(stats.totalBankIn)}</div>
            </div>
            <div>
              <div className="text-warm-400">В обороте</div>
              <div className="font-bold text-amber-700">{formatBarters(stats.totalBartersInCirculation)}</div>
            </div>
            <div>
              <div className="text-warm-400">Сделок</div>
              <div className="font-bold text-warm-700">{stats.totalDeals}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Pitch status */}
      {pitchSession && pitchSession.status === "active" && pitchSession.current_speaker && (
        <Card className="bg-violet-50 border-violet-200/60">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-violet-600" />
            <CardTitle className="text-sm text-violet-800">Питч</CardTitle>
            <Badge variant="amber">Live</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={`${pitchSession.current_speaker.user?.first_name || ""}`} size="md" />
            <div>
              <div className="text-sm font-medium text-warm-700">
                {pitchSession.current_speaker.user?.first_name} {pitchSession.current_speaker.user?.last_name || ""}
              </div>
              <div className="text-xs text-warm-400">
                Выступает #{pitchSession.current_speaker.pitch_order}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-warm-400">
            Осталось: {pitchQueue.filter((p) => p.pitch_status === "waiting").length} чел.
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1">
        {(["overview", "participants", "checkin"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t ? "bg-white text-warm-800 shadow-card" : "text-warm-400 hover:text-warm-600"
            }`}
          >
            {t === "overview" ? "Обзор" : t === "participants" ? "Участники" : "QR Check-in"}
          </button>
        ))}
      </div>

      {/* QR Check-in tab */}
      {tab === "checkin" && (
        <div className="space-y-4">
          <Card className="text-center">
            <h3 className="font-display font-semibold text-warm-800 mb-2">QR-код для check-in</h3>
            <p className="text-xs text-warm-400 mb-4">Выведите на экран или распечатайте. Участники сканируют для входа.</p>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-6 rounded-2xl border border-warm-100 inline-block">
                <QRCodeSVG
                  value={checkinUrl}
                  size={220}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#2D2A26"
                />
              </div>
            </div>
            <p className="text-[10px] text-warm-300 break-all">{checkinUrl}</p>
          </Card>
        </div>
      )}

      {/* Participants tab */}
      {tab === "participants" && (
        <Card padding="sm" className="divide-y divide-warm-100">
          {participants.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-4">Участников нет</p>
          ) : (
            participants.map((p) => {
              const name = `${p.user.first_name}${p.user.last_name ? ` ${p.user.last_name}` : ""}`;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <Avatar name={name} src={p.user.photo_url || undefined} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-warm-700 truncate">{name}</span>
                      {p.checked_in && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-warm-400">
                      {p.paid ? <span className="text-sky-500">Оплачено</span> : <span className="text-amber-500">Не оплачено</span>}
                      {p.checked_in ? <span className="text-emerald-500">В игре</span> : null}
                      <span>{formatBarters(p.balance_b)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!p.checked_in && p.paid && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckin(p.user.id)}
                        disabled={actionLoading === `checkin_${p.user.id}`}
                      >
                        {actionLoading === `checkin_${p.user.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      </Button>
                    )}
                    {p.checked_in && game.bank_open && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDepositUserId(p.user.id); setDepositAmount(""); }}
                      >
                        <Banknote className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Quick participant summary */}
          <Card>
            <CardTitle className="text-sm mb-3">Участники в игре</CardTitle>
            {checkedIn.length === 0 ? (
              <p className="text-xs text-warm-400">Пока никто не прошел check-in</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {checkedIn.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-3 py-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700">{p.user.first_name}</span>
                    <span className="text-[10px] text-emerald-400">{formatBarters(p.balance_b)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Paid but not checked in */}
          {paid.filter((p) => !p.checked_in).length > 0 && (
            <Card>
              <CardTitle className="text-sm mb-3">Оплатили, ждут check-in</CardTitle>
              <div className="flex flex-wrap gap-2">
                {paid.filter((p) => !p.checked_in).map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-sky-50 rounded-full px-3 py-1.5">
                    <CreditCard className="w-3 h-3 text-sky-400" />
                    <span className="text-xs font-medium text-sky-700">{p.user.first_name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Deposit modal */}
      {depositUserId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-display font-bold text-lg text-warm-800 mb-4">Пополнение баланса</h3>
            <p className="text-sm text-warm-400 mb-4">
              Участник вносит наличные, вы начисляете бартеры.
              Курс: 1 000 Р = 10 000 Б
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1">Сумма в рублях</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="1000"
                  min="100"
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(String(amt))}
                    className="flex-1 py-2 rounded-xl border border-warm-200 text-xs font-medium text-warm-600 hover:bg-warm-50 transition-colors"
                  >
                    {amt.toLocaleString("ru")} Р
                  </button>
                ))}
              </div>
              {depositAmount && (
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-warm-400">Будет начислено</div>
                  <div className="font-display font-bold text-lg text-amber-700">
                    {formatBarters(parseInt(depositAmount) * 10)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setDepositUserId(null)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleDeposit} disabled={depositing || !depositAmount}>
                {depositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                Начислить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
