"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth";
import { api, type DBUser, type DBGame, type AdminStats } from "@/lib/api";
import { formatBarters, formatRubles } from "@/lib/utils";
import {
  Users,
  BarChart3,
  Gamepad2,
  Loader2,
  Search,
  ShieldCheck,
  ArrowLeft,
  TrendingUp,
  Landmark,
  Handshake,
  Award,
  Ban,
  CheckCircle,
  Plus,
  Send,
  Megaphone,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

type Tab = "stats" | "users" | "games" | "broadcast";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");

  if (authLoading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="p-4 text-center py-20">
        <ShieldCheck className="w-12 h-12 text-warm-300 mx-auto mb-4" />
        <p className="text-warm-500 mb-2 font-semibold">Доступ запрещен</p>
        <p className="text-sm text-warm-400 mb-4">Эта страница доступна только администраторам</p>
        <Link href="/home">
          <Button variant="outline" size="sm">На главную</Button>
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Обзор", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "games", label: "Игры", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "users", label: "Люди", icon: <Users className="w-4 h-4" /> },
    { id: "broadcast", label: "Рассылка", icon: <Megaphone className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <button className="w-9 h-9 rounded-xl bg-warm-100 hover:bg-warm-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-warm-500" />
          </button>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-warm-800">Админ-панель</h1>
          <p className="text-xs text-warm-400">Управление системой</p>
        </div>
      </div>

      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              tab === t.id
                ? "bg-white text-warm-800 shadow-sm"
                : "text-warm-400 hover:text-warm-600"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "games" && <GamesTab />}
      {tab === "users" && <UsersTab />}
      {tab === "broadcast" && <BroadcastTab />}
    </div>
  );
}

/* ─── Stats Tab ──────────────────────────────────── */

function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminGetStats()
      .then(setStats)
      .catch((e) => setError(e.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-warm-300 animate-spin" /></div>;
  }

  if (error || !stats) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-brand-coral mb-2">{error || "Нет данных"}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Повторить</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={<Users className="w-5 h-5" />} iconBg="bg-sky-50 text-sky-600" label="Пользователи" value={stats.users.total.toString()} />
        <MetricCard icon={<Gamepad2 className="w-5 h-5" />} iconBg="bg-violet-50 text-violet-600" label="Игры" value={stats.games.total.toString()} />
        <MetricCard icon={<Handshake className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600" label="Сделки" value={stats.transactions.totalTransfers.toString()} />
        <MetricCard icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-amber-50 text-amber-600" label="Объем" value={formatBarters(stats.transactions.totalVolumeB)} />
      </div>

      <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/40">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-5 h-5 text-brand-amber" />
          <CardTitle className="text-base">Финансы (все игры)</CardTitle>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-warm-400 mb-1">Принято</div>
            <div className="font-display font-bold text-lg text-warm-800">{formatRubles(stats.transactions.totalBankInRub)}</div>
          </div>
          <div>
            <div className="text-xs text-warm-400 mb-1">Выдано</div>
            <div className="font-display font-bold text-lg text-warm-800">{formatRubles(stats.transactions.totalBankOutRub)}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-brand-amber" />
          <CardTitle className="text-base">Сертификаты</CardTitle>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="font-display font-bold text-lg text-amber-700">{stats.certificates.active}</div>
            <div className="text-[10px] text-amber-500">Активных</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="font-display font-bold text-lg text-emerald-700">{stats.certificates.redeemed}</div>
            <div className="text-[10px] text-emerald-500">Погашено</div>
          </div>
          <div className="bg-warm-50 rounded-xl p-3">
            <div className="font-display font-bold text-lg text-warm-500">{stats.certificates.expired}</div>
            <div className="text-[10px] text-warm-400">Истекло</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Games Tab ──────────────────────────────────── */

function GamesTab() {
  const [games, setGames] = useState<DBGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getGames()
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusLabels: Record<string, string> = {
    draft: "Черновик", open: "Открыта", active: "Активна", done: "Завершена", archive: "Архив",
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setShowForm(!showForm)}>
        <Plus className="w-4 h-4" />
        Создать игру
      </Button>

      {showForm && <CreateGameForm onCreated={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-warm-300 animate-spin" /></div>
      ) : games.length === 0 ? (
        <Card className="text-center py-8">
          <Gamepad2 className="w-10 h-10 text-warm-200 mx-auto mb-3" />
          <p className="text-sm text-warm-400">Игр пока нет</p>
        </Card>
      ) : (
        games.map((g) => (
          <Card key={g.id} padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-warm-700 truncate">{g.title}</div>
                <div className="text-[10px] text-warm-400">
                  {new Date(g.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  {g.location ? ` · ${g.location}` : ""}
                </div>
                {g.ticket_price_rub > 0 && (
                  <div className="text-[10px] text-warm-400">Билет: {formatRubles(g.ticket_price_rub)}</div>
                )}
              </div>
              <Badge variant={
                g.status === "active" ? "sage" : g.status === "open" ? "amber" : "default"
              }>
                {statusLabels[g.status] || g.status}
              </Badge>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function CreateGameForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [maxParticipants, setMaxParticipants] = useState("20");
  const [pitchDuration, setPitchDuration] = useState("2");
  const [ticketPrice, setTicketPrice] = useState("7000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    setError("");
    try {
      await api.createGame({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        event_date: `${date}T${time}:00`,
        max_participants: Number(maxParticipants) || null,
        pitch_duration_sec: (Number(pitchDuration) || 2) * 60,
        ticket_price_rub: Number(ticketPrice) || 0,
      } as Partial<DBGame>);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания");
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-amber/40";

  return (
    <Card>
      <CardTitle className="text-base mb-4">Новая игра</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> Название *</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Бартерия #1" required />
        </div>
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 block">Описание</label>
          <textarea className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Описание игры..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Место</label>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Адрес" />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Дата *</label>
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Время</label>
            <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 flex items-center gap-1"><UsersRound className="w-3 h-3" /> Макс.</label>
            <input className={inputClass} type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 flex items-center gap-1"><Ticket className="w-3 h-3" /> Цена (₽)</label>
            <input className={inputClass} type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 block">Питч (мин)</label>
          <input className={inputClass} type="number" value={pitchDuration} onChange={(e) => setPitchDuration(e.target.value)} min="1" max="10" />
        </div>
        {error && <p className="text-xs text-brand-coral">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Создать
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Отмена</Button>
        </div>
      </form>
    </Card>
  );
}

/* ─── Users Tab ──────────────────────────────────── */

function UsersTab() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState<"" | "blocked" | "active">("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api.adminGetUsers(search || undefined)
      .then((data) => {
        if (blockFilter === "blocked") setUsers(data.filter((u) => u.is_blocked));
        else if (blockFilter === "active") setUsers(data.filter((u) => !u.is_blocked));
        else setUsers(data);
      })
      .catch((e) => setError(e.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [search, blockFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const handleToggleBlock = async (userId: string, block: boolean) => {
    setToggling(userId);
    try {
      const updated = await api.adminUpdateUser(userId, { is_blocked: block });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
        <input
          type="text"
          placeholder="Поиск по имени, username, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-warm-200 bg-white text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-amber/40"
        />
      </div>

      <div className="flex gap-2">
        {([
          { value: "" as const, label: "Все" },
          { value: "active" as const, label: "Активные" },
          { value: "blocked" as const, label: "Заблокированные" },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setBlockFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              blockFilter === f.value
                ? "bg-brand-amber text-white"
                : "bg-warm-100 text-warm-500 hover:bg-warm-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-warm-300 animate-spin" /></div>
      ) : error ? (
        <Card className="text-center py-6">
          <p className="text-sm text-brand-coral mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Повторить</Button>
        </Card>
      ) : users.length === 0 ? (
        <Card className="text-center py-8"><p className="text-sm text-warm-400">Пользователи не найдены</p></Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-warm-400 px-1">{users.length} пользователей</p>
          {users.map((u) => {
            const fullName = `${u.first_name}${u.last_name ? ` ${u.last_name}` : ""}`;
            return (
              <Card key={u.id} padding="sm" className={u.is_blocked ? "opacity-60" : ""}>
                <div className="flex items-center gap-3">
                  <Avatar name={fullName} src={u.photo_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-warm-700 truncate">{fullName}</span>
                      {u.is_blocked && <Badge variant="coral">Заблокирован</Badge>}
                    </div>
                    <div className="text-[10px] text-warm-400 truncate">
                      {u.username ? `@${u.username}` : ""}
                      {u.phone ? ` ${u.phone}` : ""}
                    </div>
                    <div className="text-[10px] text-warm-300">
                      {new Date(u.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleBlock(u.id, !u.is_blocked)}
                    disabled={toggling === u.id}
                    className={`shrink-0 p-2 rounded-xl transition-colors ${
                      u.is_blocked
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                        : "bg-red-50 hover:bg-red-100 text-red-500"
                    }`}
                    title={u.is_blocked ? "Разблокировать" : "Заблокировать"}
                  >
                    {toggling === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : u.is_blocked ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Broadcast Tab ──────────────────────────────── */

function BroadcastTab() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<"all" | "game_participants">("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await api.adminBroadcast(text.trim(), target);
      setResult(res);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-brand-amber" />
          <CardTitle className="text-base">Рассылка через Telegram-бот</CardTitle>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-warm-500 mb-2 block">Кому отправить</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTarget("all")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  target === "all"
                    ? "bg-brand-amber text-white"
                    : "bg-warm-100 text-warm-500 hover:bg-warm-200"
                }`}
              >
                Все пользователи
              </button>
              <button
                onClick={() => setTarget("game_participants")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  target === "game_participants"
                    ? "bg-brand-amber text-white"
                    : "bg-warm-100 text-warm-500 hover:bg-warm-200"
                }`}
              >
                Участники игр
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Текст сообщения</label>
            <textarea
              className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-amber/40"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Привет! Напоминаем, что завтра состоится игра Бартерия..."
            />
            <p className="text-[10px] text-warm-300 mt-1">Сообщение придет от @barteriya_bot</p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? "Отправка..." : "Отправить рассылку"}
          </Button>

          {error && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600">{error}</div>
          )}

          {result && (
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-sm font-medium text-emerald-700">Рассылка завершена</p>
              <p className="text-xs text-emerald-600 mt-1">
                Отправлено: {result.sent} из {result.total}
                {result.failed > 0 && ` (не доставлено: ${result.failed})`}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-warm-50/50">
        <p className="text-xs text-warm-400">
          Рассылка отправляется через Telegram-бот. Пользователи получат сообщение, только если они хотя бы раз взаимодействовали с ботом @barteriya_bot (написали /start).
        </p>
      </Card>
    </div>
  );
}

/* ─── Shared Components ─────────────────────────── */

function MetricCard({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <div className="text-[10px] text-warm-400">{label}</div>
        <div className="font-display font-bold text-lg text-warm-800">{value}</div>
      </div>
    </Card>
  );
}
