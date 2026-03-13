"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useGame } from "@/context/game";
import { api, type DBTransaction } from "@/lib/api";
import { formatBarters, formatTimeAgo } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  QrCode,
  Send,
  Mic,
  ArrowRightLeft,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSupabaseSubscription } from "@/hooks/use-realtime";

export default function HomePage() {
  return (
    <div className="p-4 space-y-5">
      <BalanceCard />
      <QuickActions />
      <RecentDeals />
    </div>
  );
}

function BalanceCard() {
  const { user } = useAuth();
  const { activeGame, myParticipant } = useGame();

  const balance = myParticipant?.balance_b ?? 0;
  const gameName = activeGame?.title ?? "Нет активной игры";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-amber via-amber-500 to-brand-gold p-6 text-white shadow-warm">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-6 -translate-x-6" />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/70">Мой баланс</span>
          {activeGame && (
            <Badge className="bg-white/20 text-white border-0 text-[10px]">{gameName}</Badge>
          )}
        </div>

        <div className="font-display font-bold text-4xl mb-1">
          {formatBarters(balance)}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-white/70">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{user?.first_name ?? "Гость"}</span>
        </div>

        <div className="mt-5 flex gap-3">
          <Link href="/transfer" className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <Send className="w-4 h-4" />
              Перевести
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm px-4"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { icon: <Landmark className="w-5 h-5" />, label: "Банк", color: "bg-amber-50 text-amber-600", href: "#" },
    { icon: <Mic className="w-5 h-5" />, label: "Питч", color: "bg-violet-50 text-violet-600", href: "/pitch" },
    { icon: <ArrowRightLeft className="w-5 h-5" />, label: "История", color: "bg-sky-50 text-sky-600", href: "#" },
    { icon: <QrCode className="w-5 h-5" />, label: "Мой QR", color: "bg-emerald-50 text-emerald-600", href: "#" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-warm-200/40 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
              {action.icon}
            </div>
            <span className="text-[11px] font-medium text-warm-600">{action.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function RecentDeals() {
  const { activeGame } = useGame();
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(() => {
    if (!activeGame) return;
    api.getTransactions(activeGame.id)
      .then((txs) => setTransactions(txs.slice(0, 5)))
      .catch(() => {});
  }, [activeGame]);

  useEffect(() => {
    if (!activeGame) return;
    setLoading(true);
    api.getTransactions(activeGame.id)
      .then((txs) => setTransactions(txs.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGame]);

  useSupabaseSubscription(
    `home-txs-${activeGame?.id}`,
    [
      {
        table: "transactions",
        event: "INSERT",
        filter: activeGame ? `game_id=eq.${activeGame.id}` : undefined,
        callback: () => fetchTransactions(),
      },
    ],
    !!activeGame
  );

  const getUserName = (tx: DBTransaction, side: "from" | "to") => {
    const u = side === "from" ? tx.from_user : tx.to_user;
    if (!u) return "Банк";
    return `${u.first_name}${u.last_name ? ` ${u.last_name}` : ""}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-warm-800">Последние сделки</h2>
        <Link href="#" className="text-xs text-brand-amber font-medium">Все</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-warm-300 animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <Card padding="sm">
          <p className="text-sm text-warm-400 text-center py-4">Сделок пока нет</p>
        </Card>
      ) : (
        <Card padding="sm" className="divide-y divide-warm-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-3 px-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                tx.type === "bank_in" ? "bg-emerald-50 text-emerald-500" :
                tx.type === "bank_out" ? "bg-amber-50 text-amber-500" :
                "bg-sky-50 text-sky-500"
              }`}>
                {tx.type === "bank_in" ? <ArrowDownLeft className="w-4 h-4" /> :
                 tx.type === "bank_out" ? <ArrowUpRight className="w-4 h-4" /> :
                 <ArrowRightLeft className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-warm-700 truncate">
                  {tx.type === "transfer"
                    ? `${getUserName(tx, "from")} → ${getUserName(tx, "to")}`
                    : tx.type === "bank_in"
                    ? `Банк → ${getUserName(tx, "to")}`
                    : `${getUserName(tx, "from")} → Банк`}
                </div>
                <div className="text-xs text-warm-400 truncate">{tx.note}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-semibold ${
                  tx.type === "bank_in" ? "text-emerald-600" :
                  tx.type === "bank_out" ? "text-amber-600" :
                  "text-warm-700"
                }`}>
                  {tx.type === "bank_in" ? "+" : tx.type === "bank_out" ? "-" : ""}
                  {formatBarters(tx.amount_b)}
                </div>
                <div className="text-[10px] text-warm-400">{formatTimeAgo(new Date(tx.created_at))}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
