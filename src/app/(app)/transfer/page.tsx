"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth";
import { useGame } from "@/context/game";
import { api, type DBParticipant } from "@/lib/api";
import { formatBarters } from "@/lib/utils";
import { Search, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

type Step = "search" | "amount" | "confirm" | "success";

export default function TransferPage() {
  const { user } = useAuth();
  const { activeGame, myParticipant, refreshGame } = useGame();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DBParticipant | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [participants, setParticipants] = useState<DBParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeGame) return;
    setLoading(true);
    api.getGame(activeGame.id)
      .then((g) => setParticipants(g.participants || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGame]);

  const otherParticipants = participants.filter(
    (p) => p.user_id !== user?.id && p.user
  );

  const filtered = otherParticipants.filter((p) => {
    if (!query) return true;
    const name = `${p.user!.first_name} ${p.user!.last_name || ""}`.toLowerCase();
    const username = (p.user!.username || "").toLowerCase();
    return name.includes(query.toLowerCase()) || username.includes(query.toLowerCase());
  });

  const getParticipantName = (p: DBParticipant) =>
    `${p.user!.first_name}${p.user!.last_name ? ` ${p.user!.last_name}` : ""}`;

  const handleTransfer = async () => {
    if (!activeGame || !selected || !user) return;
    setSending(true);
    try {
      await api.transfer(activeGame.id, selected.user_id, Number(amount), note);
      setStep("success");
      if (activeGame) refreshGame(activeGame.id);
    } catch (err) {
      console.error("Transfer error:", err);
    } finally {
      setSending(false);
    }
  };

  const balance = myParticipant?.balance_b ?? 0;

  if (step === "success") {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-brand-sage-light flex items-center justify-center mb-6 animate-slide-up">
          <Check className="w-10 h-10 text-brand-sage" />
        </div>
        <h2 className="font-display font-bold text-2xl text-warm-800 mb-2 animate-slide-up-delayed">
          Перевод отправлен!
        </h2>
        <p className="text-warm-400 mb-2 animate-slide-up-delayed-2">
          {formatBarters(Number(amount))} → {selected ? getParticipantName(selected) : ""}
        </p>
        <p className="text-sm text-warm-400 mb-8">Сертификат создан автоматически</p>
        <div className="flex gap-3 w-full max-w-xs">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setStep("search"); setSelected(null); setAmount(""); setNote(""); }}
          >
            Ещё перевод
          </Button>
          <Button className="flex-1" onClick={() => setStep("search")}>
            К сделкам
          </Button>
        </div>
      </div>
    );
  }

  if (step === "confirm" && selected) {
    const name = getParticipantName(selected);
    return (
      <div className="p-4 space-y-5">
        <h1 className="font-display font-bold text-2xl text-warm-800">Подтверждение</h1>

        <Card className="text-center">
          <Avatar name={name} size="xl" className="mx-auto mb-3" />
          <h3 className="font-display font-semibold text-warm-800 text-lg">{name}</h3>
          <p className="text-xs text-warm-400 mb-4">@{selected.user!.username || "user"}</p>

          <div className="py-4 border-y border-warm-100 mb-4">
            <div className="text-xs text-warm-400 mb-1">Сумма перевода</div>
            <div className="font-display font-bold text-3xl text-brand-amber">
              {formatBarters(Number(amount))}
            </div>
          </div>

          {note && (
            <div className="text-left bg-cream-100 rounded-xl p-3 mb-4">
              <div className="text-xs text-warm-400 mb-1">Услуга</div>
              <div className="text-sm text-warm-600">{note}</div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
              Назад
            </Button>
            <Button className="flex-1" onClick={handleTransfer} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Подтвердить"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "amount" && selected) {
    const name = getParticipantName(selected);
    return (
      <div className="p-4 space-y-5">
        <button onClick={() => setStep("search")} className="text-sm text-warm-400 hover:text-warm-600 flex items-center gap-1">
          <X className="w-4 h-4" /> Отмена
        </button>

        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-warm-200/40 shadow-card">
          <Avatar name={name} />
          <div>
            <div className="font-medium text-warm-700">{name}</div>
            <div className="text-xs text-warm-400">{selected.user!.about || ""}</div>
          </div>
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-2 block">Сумма в Бартерах</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
                onClick={() => setAmount(String(a))}
                className="px-3 py-1.5 rounded-xl bg-cream-100 text-xs font-medium text-warm-500 hover:bg-cream-200 transition-colors"
              >
                {(a / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-warm-500 mb-2 block">За что (услуга)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Опишите услугу или товар..."
            className="w-full rounded-2xl border-2 border-warm-200 focus:border-brand-amber focus:outline-none p-4 text-sm text-warm-700 placeholder:text-warm-300 resize-none transition-colors bg-white"
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!amount || Number(amount) <= 0 || Number(amount) > balance}
          onClick={() => setStep("confirm")}
        >
          Далее
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Search step
  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-warm-800 mb-1">Перевод</h1>
        <p className="text-sm text-warm-400">Найдите участника для перевода Бартеров</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Имя или @username..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-2 border-warm-200 focus:border-brand-amber focus:outline-none text-sm text-warm-700 placeholder:text-warm-300 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-warm-300 animate-spin" />
        </div>
      ) : !activeGame ? (
        <Card padding="sm">
          <p className="text-sm text-warm-400 text-center py-4">Сначала войдите в игру</p>
        </Card>
      ) : (
        <Card padding="sm" className="divide-y divide-warm-100">
          {filtered.map((p) => {
            const name = getParticipantName(p);
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p); setStep("amount"); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-cream-50 rounded-xl transition-colors text-left"
              >
                <Avatar name={name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-warm-700">{name}</div>
                  <div className="text-xs text-warm-400 truncate">{p.user!.about || ""}</div>
                </div>
                <div className="text-xs text-warm-300">@{p.user!.username || "user"}</div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-warm-400 text-center py-4">Участники не найдены</p>
          )}
        </Card>
      )}
    </div>
  );
}
