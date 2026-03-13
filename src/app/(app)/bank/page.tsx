"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/game";
import { api } from "@/lib/api";
import { formatBarters, formatRubles } from "@/lib/utils";
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  ChevronLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const EXCHANGE_RATE = 10;

type Mode = "menu" | "deposit" | "withdraw" | "success";

export default function BankPage() {
  const { activeGame, myParticipant, refreshGame } = useGame();
  const [mode, setMode] = useState<Mode>("menu");
  const [amountRub, setAmountRub] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultAmount, setResultAmount] = useState(0);
  const [resultType, setResultType] = useState<"deposit" | "withdraw">("deposit");

  const balance = myParticipant?.balance_b ?? 0;
  const bankOpen = activeGame?.bank_open ?? false;

  const handleDeposit = async () => {
    if (!activeGame) return;
    const rub = Number(amountRub);
    if (!rub || rub <= 0) return;
    setLoading(true);
    setError("");
    try {
      await api.deposit(activeGame.id, rub);
      setResultAmount(rub * EXCHANGE_RATE);
      setResultType("deposit");
      setMode("success");
      refreshGame(activeGame.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeGame) return;
    const b = Number(amountB);
    if (!b || b <= 0) return;
    setLoading(true);
    setError("");
    try {
      await api.withdraw(activeGame.id, b);
      setResultAmount(b);
      setResultType("withdraw");
      setMode("success");
      refreshGame(activeGame.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!activeGame || !myParticipant) {
    return (
      <div className="p-4 text-center py-20">
        <Landmark className="w-10 h-10 text-warm-300 mx-auto mb-3" />
        <p className="text-warm-400 mb-4">Войдите в игру, чтобы использовать банк</p>
        <Link href="/games">
          <Button size="sm">К играм</Button>
        </Link>
      </div>
    );
  }

  if (mode === "success") {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-brand-sage-light flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-brand-sage" />
        </div>
        <h2 className="font-display font-bold text-2xl text-warm-800 mb-2">
          {resultType === "deposit" ? "Бартеры зачислены!" : "Бартеры возвращены!"}
        </h2>
        <p className="text-warm-400 mb-6">
          {resultType === "deposit"
            ? `+${formatBarters(resultAmount)} на ваш баланс`
            : `${formatBarters(resultAmount)} списано`}
        </p>
        <Button onClick={() => { setMode("menu"); setAmountRub(""); setAmountB(""); }}>
          Готово
        </Button>
      </div>
    );
  }

  if (mode === "deposit") {
    const rub = Number(amountRub) || 0;
    const barters = rub * EXCHANGE_RATE;
    return (
      <div className="p-4 space-y-5">
        <button onClick={() => { setMode("menu"); setError(""); }} className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>

        <div>
          <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Купить Бартеры</h1>
          <p className="text-sm text-warm-400">Курс: 1 000 ₽ = 10 000 Б</p>
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-2 block">Сумма в рублях</label>
          <div className="relative">
            <input
              type="number"
              value={amountRub}
              onChange={(e) => setAmountRub(e.target.value)}
              placeholder="0"
              className="w-full text-4xl font-display font-bold text-center py-6 bg-white rounded-2xl border-2 border-warm-200 focus:border-brand-amber focus:outline-none transition-colors text-warm-800 placeholder:text-warm-200"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 font-display font-medium">₽</div>
          </div>
          <div className="flex gap-2 mt-3 justify-center">
            {[500, 1000, 2000, 5000].map((a) => (
              <button
                key={a}
                onClick={() => setAmountRub(String(a))}
                className="px-3 py-1.5 rounded-xl bg-cream-100 text-xs font-medium text-warm-500 hover:bg-cream-200 transition-colors"
              >
                {formatRubles(a)}
              </button>
            ))}
          </div>
        </div>

        {rub > 0 && (
          <Card className="bg-amber-50 border-amber-200/60">
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-500">Вы получите</span>
              <span className="font-display font-bold text-lg text-brand-amber">{formatBarters(barters)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-warm-500">Баланс после</span>
              <span className="text-sm font-semibold text-warm-700">{formatBarters(balance + barters)}</span>
            </div>
          </Card>
        )}

        {error && (
          <div className="bg-red-50 rounded-xl p-3 text-sm text-brand-coral flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <Button size="lg" className="w-full" onClick={handleDeposit} disabled={loading || !rub || rub <= 0}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownLeft className="w-5 h-5" />}
          Купить за {rub > 0 ? formatRubles(rub) : "0 ₽"}
        </Button>
      </div>
    );
  }

  if (mode === "withdraw") {
    const b = Number(amountB) || 0;
    const rub = Math.floor(b / EXCHANGE_RATE);
    return (
      <div className="p-4 space-y-5">
        <button onClick={() => { setMode("menu"); setError(""); }} className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>

        <div>
          <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Вернуть Бартеры</h1>
          <p className="text-sm text-warm-400">Курс: 10 000 Б = 1 000 ₽</p>
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-2 block">Сумма в Бартерах</label>
          <div className="relative">
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0"
              className="w-full text-4xl font-display font-bold text-center py-6 bg-white rounded-2xl border-2 border-warm-200 focus:border-brand-amber focus:outline-none transition-colors text-warm-800 placeholder:text-warm-200"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 font-display font-medium">Б</div>
          </div>
          <div className="text-center mt-2 text-xs text-warm-400">
            Доступно: {formatBarters(balance)}
          </div>
          <div className="flex gap-2 mt-3 justify-center">
            {[5000, 10000, 20000, 50000].map((a) => (
              <button
                key={a}
                onClick={() => setAmountB(String(Math.min(a, balance)))}
                className="px-3 py-1.5 rounded-xl bg-cream-100 text-xs font-medium text-warm-500 hover:bg-cream-200 transition-colors"
              >
                {(a / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        {b > 0 && (
          <Card className="bg-amber-50 border-amber-200/60">
            <div className="flex justify-between items-center">
              <span className="text-sm text-warm-500">Вы получите</span>
              <span className="font-display font-bold text-lg text-warm-800">{formatRubles(rub)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-warm-500">Баланс после</span>
              <span className={`text-sm font-semibold ${balance >= b ? "text-brand-sage" : "text-brand-coral"}`}>
                {formatBarters(balance - b)}
              </span>
            </div>
          </Card>
        )}

        {error && (
          <div className="bg-red-50 rounded-xl p-3 text-sm text-brand-coral flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <Button size="lg" className="w-full" onClick={handleWithdraw} disabled={loading || !b || b <= 0 || b > balance}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
          Вернуть {b > 0 ? formatBarters(b) : "0 Б"}
        </Button>
        {b > balance && (
          <p className="text-xs text-brand-coral text-center">Недостаточно Бартеров</p>
        )}
      </div>
    );
  }

  // Menu
  return (
    <div className="p-4 space-y-5">
      <Link href={`/games/${activeGame.id}`} className="inline-flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600">
        <ChevronLeft className="w-4 h-4" /> {activeGame.title}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Банк</h1>
          <p className="text-sm text-warm-400">
            Курс: 1 000 ₽ = 10 000 Б
          </p>
        </div>
        <Badge variant={bankOpen ? "sage" : "outline"}>
          {bankOpen ? "Открыт" : "Закрыт"}
        </Badge>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-amber flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-warm-400">Мой баланс</div>
            <div className="font-display font-bold text-2xl text-warm-800">{formatBarters(balance)}</div>
          </div>
        </div>
      </Card>

      {!bankOpen ? (
        <Card className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-400 text-sm">Банк сейчас закрыт</p>
          <p className="text-warm-300 text-xs mt-1">Организатор откроет банк во время игры</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("deposit")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-warm-200/40 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-warm-700">Купить Б</div>
              <div className="text-xs text-warm-400 mt-0.5">₽ → Бартеры</div>
            </div>
          </button>
          <button
            onClick={() => setMode("withdraw")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-warm-200/40 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-warm-700">Вернуть Б</div>
              <div className="text-xs text-warm-400 mt-0.5">Бартеры → ₽</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
