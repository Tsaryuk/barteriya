"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { api, type DBGame } from "@/lib/api";
import { formatBarters, formatRubles } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  Users,
  Landmark,
  Mic,
  ArrowRightLeft,
  Timer,
} from "lucide-react";

interface TVParticipant {
  id: string;
  balance_b: number;
  pitch_order: number | null;
  pitch_status: string;
  paid: boolean;
  checked_in: boolean;
  user: {
    id: string;
    first_name: string;
    last_name: string | null;
    username: string | null;
    photo_url: string | null;
  };
}

interface TVStats {
  totalParticipants: number;
  paidCount: number;
  checkedInCount: number;
  totalDeals: number;
  totalBankIn: number;
  totalBartersInCirculation: number;
  avgDealSize: number;
}

interface TVTransaction {
  id: string;
  type: string;
  amount_b: number;
  amount_rub: number | null;
  note: string | null;
  created_at: string;
  from_user: { first_name: string; last_name: string | null } | null;
  to_user: { first_name: string; last_name: string | null } | null;
}

interface TVPitchSession {
  id: string;
  status: string;
  current_speaker_id: string | null;
  speaker_started_at: string | null;
  current_speaker?: TVParticipant;
}

interface TVData {
  game: DBGame;
  stats: TVStats;
  participants: TVParticipant[];
  transactions: TVTransaction[];
  pitchSession: TVPitchSession | null;
  pitchQueue: TVParticipant[];
}

function PitchTimer({ startedAt, durationSec }: { startedAt: string; durationSec: number }) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setRemaining(Math.max(0, durationSec - elapsed));
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [startedAt, durationSec]);

  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const isLow = remaining < 30;

  return (
    <div className={`font-mono text-7xl font-bold tabular-nums ${isLow ? "text-red-500 animate-pulse" : "text-white"}`}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

export default function TVDashboard() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [data, setData] = useState<TVData | null>(null);

  const refresh = useCallback(async () => {
    try {
      const d = await api.getDashboard(gameId);
      setData(d as unknown as TVData);
    } catch {}
  }, [gameId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-white/40 text-xl">Загрузка...</div>
      </div>
    );
  }

  const { game, stats, participants, transactions, pitchSession, pitchQueue } = data;
  const checkedIn = participants.filter((p) => p.checked_in);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const checkinUrl = `${appUrl}/checkin/${gameId}`;
  const isPitchActive = pitchSession?.status === "active" && pitchSession.current_speaker;
  const recentDeals = transactions.filter((t) => t.type === "transfer").slice(0, 5);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{game.title}</h1>
          <p className="text-white/40 text-lg mt-1">Бартерия</p>
        </div>
        <div className="flex items-center gap-6">
          {game.bank_open && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Банк открыт</span>
            </div>
          )}
          {game.status === "active" && (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-400 font-medium">Игра идёт</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
        {/* Left column: QR + Stats */}
        <div className="col-span-3 space-y-6">
          {/* QR Code */}
          <div className="bg-white/5 backdrop-blur rounded-3xl p-6 text-center">
            <p className="text-white/60 text-sm mb-4">Отсканируйте для check-in</p>
            <div className="bg-white rounded-2xl p-4 inline-block">
              <QRCodeSVG
                value={checkinUrl}
                size={180}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#1a1a2e"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.checkedInCount}</div>
              <div className="text-white/40 text-xs">в игре</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center">
              <ArrowRightLeft className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
              <div className="text-white/40 text-xs">сделок</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center">
              <Landmark className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatRubles(stats.totalBankIn)}</div>
              <div className="text-white/40 text-xs">в банке</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-amber-400 text-xs font-bold mb-2">Б</div>
              <div className="text-2xl font-bold">{formatBarters(stats.totalBartersInCirculation)}</div>
              <div className="text-white/40 text-xs">в обороте</div>
            </div>
          </div>
        </div>

        {/* Center: Pitch or Participants */}
        <div className="col-span-6 space-y-6">
          {/* Pitch active */}
          {isPitchActive && pitchSession.speaker_started_at && (
            <div className="bg-gradient-to-br from-violet-900/60 to-purple-900/60 backdrop-blur rounded-3xl p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-violet-400" />
                <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">Питч-сессия</span>
              </div>
              <div className="mb-6">
                <Avatar
                  name={`${pitchSession.current_speaker!.user.first_name}`}
                  src={pitchSession.current_speaker!.user.photo_url || undefined}
                  size="lg"
                />
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {pitchSession.current_speaker!.user.first_name} {pitchSession.current_speaker!.user.last_name || ""}
              </h2>
              <p className="text-white/40 mb-6">
                #{pitchSession.current_speaker!.pitch_order} из {pitchQueue.length}
              </p>
              <PitchTimer
                startedAt={pitchSession.speaker_started_at}
                durationSec={game.pitch_duration_sec}
              />
              <div className="mt-6 flex justify-center gap-2 flex-wrap">
                {pitchQueue.filter((p) => p.pitch_status === "waiting").slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <span className="text-white/60 text-xs">#{p.pitch_order}</span>
                    <span className="text-white/80 text-xs font-medium">{p.user.first_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participants grid */}
          <div className="bg-white/5 backdrop-blur rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white/80">Участники в игре</h3>
              <span className="text-white/40 text-sm">{checkedIn.length} чел.</span>
            </div>
            {checkedIn.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/30 text-lg">Ожидаем участников...</p>
                <p className="text-white/20 text-sm mt-2">Отсканируйте QR-код слева для check-in</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                {checkedIn.map((p) => (
                  <div key={p.id} className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <Avatar
                      name={`${p.user.first_name}`}
                      src={p.user.photo_url || undefined}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white/90 truncate">
                        {p.user.first_name} {p.user.last_name?.[0] || ""}
                      </div>
                      <div className="text-xs text-amber-400 font-medium">{formatBarters(p.balance_b)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Recent deals */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white/5 backdrop-blur rounded-3xl p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <h3 className="text-lg font-semibold text-white/80">Последние сделки</h3>
            </div>
            {recentDeals.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Сделок пока нет</p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((tx) => (
                  <div key={tx.id} className="bg-white/5 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">
                        {tx.from_user?.first_name} &rarr; {tx.to_user?.first_name}
                      </span>
                      <span className="text-sm font-bold text-amber-400">{formatBarters(tx.amount_b)}</span>
                    </div>
                    {tx.note && <p className="text-[10px] text-white/30 truncate">{tx.note}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Waiting for check-in */}
            {stats.paidCount > stats.checkedInCount && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-sky-400" />
                  <span className="text-sm text-white/60">Ожидают check-in</span>
                </div>
                <div className="text-2xl font-bold text-sky-400">
                  {stats.paidCount - stats.checkedInCount}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
