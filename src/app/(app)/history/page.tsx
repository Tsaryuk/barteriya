"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/game";
import { useAuth } from "@/context/auth";
import { api, type DBTransaction } from "@/lib/api";
import { formatBarters, formatRubles, formatTimeAgo } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Loader2,
  ChevronLeft,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSupabaseSubscription } from "@/hooks/use-realtime";

export default function HistoryPage() {
  const { activeGame } = useGame();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTx = useCallback(() => {
    if (!activeGame) return;
    api.getTransactions(activeGame.id)
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGame]);

  useEffect(() => {
    fetchTx();
  }, [fetchTx]);

  useSupabaseSubscription(
    `history-${activeGame?.id}`,
    [
      {
        table: "transactions",
        event: "INSERT",
        filter: activeGame ? `game_id=eq.${activeGame.id}` : undefined,
        callback: () => fetchTx(),
      },
    ],
    !!activeGame
  );

  if (!activeGame) {
    return (
      <div className="p-4 text-center py-20">
        <Receipt className="w-10 h-10 text-warm-300 mx-auto mb-3" />
        <p className="text-warm-400 mb-4">Выберите игру</p>
        <Link href="/games">
          <Button size="sm">К играм</Button>
        </Link>
      </div>
    );
  }

  const getUserName = (tx: DBTransaction, side: "from" | "to") => {
    const u = side === "from" ? tx.from_user : tx.to_user;
    if (!u) return "Банк";
    return `${u.first_name}${u.last_name ? ` ${u.last_name}` : ""}`;
  };

  const getMyRole = (tx: DBTransaction) => {
    if (!user) return "neutral";
    if (tx.from_user_id === user.id) return "outgoing";
    if (tx.to_user_id === user.id) return "incoming";
    return "neutral";
  };

  return (
    <div className="p-4 space-y-5">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> Главная
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">История сделок</h1>
        <p className="text-sm text-warm-400">{activeGame.title} · {transactions.length} записей</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="text-center py-12">
          <Receipt className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-400">Сделок пока нет</p>
        </Card>
      ) : (
        <Card padding="sm" className="divide-y divide-warm-100">
          {transactions.map((tx) => {
            const role = getMyRole(tx);
            return (
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
                    role === "incoming" ? "text-emerald-600" :
                    role === "outgoing" ? "text-brand-coral" :
                    tx.type === "bank_in" ? "text-emerald-600" :
                    tx.type === "bank_out" ? "text-amber-600" :
                    "text-warm-700"
                  }`}>
                    {role === "incoming" ? "+" : role === "outgoing" ? "-" :
                     tx.type === "bank_in" ? "+" : tx.type === "bank_out" ? "-" : ""}
                    {formatBarters(tx.amount_b)}
                  </div>
                  {tx.amount_rub && (
                    <div className="text-[10px] text-warm-400">{formatRubles(tx.amount_rub)}</div>
                  )}
                  <div className="text-[10px] text-warm-400">{formatTimeAgo(new Date(tx.created_at))}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
