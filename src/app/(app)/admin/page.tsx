"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth";
import { api, type DBUser, type AdminStats } from "@/lib/api";
import { formatBarters, formatRubles } from "@/lib/utils";
import {
  Users,
  BarChart3,
  Gamepad2,
  Loader2,
  Search,
  ShieldCheck,
  Crown,
  UserCog,
  ArrowLeft,
  TrendingUp,
  Landmark,
  Handshake,
  Award,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

type Tab = "stats" | "users" | "games";

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
    { id: "stats", label: "Статистика", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: "Пользователи", icon: <Users className="w-4 h-4" /> },
    { id: "games", label: "Игры", icon: <Gamepad2 className="w-4 h-4" /> },
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

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
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
      {tab === "users" && <UsersTab />}
      {tab === "games" && <GamesTab />}
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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-warm-300 animate-spin" />
      </div>
    );
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
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-600"
          label="Пользователи"
          value={stats.users.total.toString()}
        />
        <MetricCard
          icon={<Gamepad2 className="w-5 h-5" />}
          iconBg="bg-violet-50 text-violet-600"
          label="Игры"
          value={stats.games.total.toString()}
        />
        <MetricCard
          icon={<Handshake className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          label="Сделки"
          value={stats.transactions.totalTransfers.toString()}
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
          label="Объем сделок"
          value={formatBarters(stats.transactions.totalVolumeB)}
        />
      </div>

      {/* Roles breakdown */}
      <Card>
        <CardTitle className="text-base mb-4">Роли пользователей</CardTitle>
        <div className="space-y-3">
          <RoleBar label="Участники" count={stats.users.byRole.user} total={stats.users.total} color="bg-sky-400" />
          <RoleBar label="Менеджеры" count={stats.users.byRole.manager} total={stats.users.total} color="bg-amber-400" />
          <RoleBar label="Админы" count={stats.users.byRole.admin} total={stats.users.total} color="bg-violet-400" />
        </div>
      </Card>

      {/* Bank */}
      <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/40">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-5 h-5 text-brand-amber" />
          <CardTitle className="text-base">Финансы (все игры)</CardTitle>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-warm-400 mb-1">Принято</div>
            <div className="font-display font-bold text-lg text-warm-800">
              {formatRubles(stats.transactions.totalBankInRub)}
            </div>
          </div>
          <div>
            <div className="text-xs text-warm-400 mb-1">Выдано</div>
            <div className="font-display font-bold text-lg text-warm-800">
              {formatRubles(stats.transactions.totalBankOutRub)}
            </div>
          </div>
        </div>
      </Card>

      {/* Certificates */}
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

      {/* Recent games */}
      {stats.games.list.length > 0 && (
        <Card>
          <CardTitle className="text-base mb-4">Последние игры</CardTitle>
          <div className="space-y-2">
            {stats.games.list.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-warm-700 truncate">{g.title}</div>
                  <div className="text-[10px] text-warm-400">
                    {new Date(g.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <GameStatusBadge status={g.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Users Tab ──────────────────────────────────── */

function UsersTab() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api.adminGetUsers(search || undefined, roleFilter || undefined)
      .then(setUsers)
      .catch((e) => setError(e.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      const updated = await api.adminUpdateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setChangingRole(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
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

      {/* Role filter */}
      <div className="flex gap-2">
        {[
          { value: "", label: "Все" },
          { value: "user", label: "Участники" },
          { value: "manager", label: "Менеджеры" },
          { value: "admin", label: "Админы" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setRoleFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              roleFilter === f.value
                ? "bg-brand-amber text-white"
                : "bg-warm-100 text-warm-500 hover:bg-warm-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-warm-300 animate-spin" />
        </div>
      ) : error ? (
        <Card className="text-center py-6">
          <p className="text-sm text-brand-coral mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Повторить</Button>
        </Card>
      ) : users.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-warm-400">Пользователи не найдены</p>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-warm-400 px-1">{users.length} пользователей</p>
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              changing={changingRole === u.id}
              onRoleChange={handleRoleChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  changing,
  onRoleChange,
}: {
  user: DBUser;
  changing: boolean;
  onRoleChange: (userId: string, role: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const fullName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`;

  const roleIcon = user.role === "admin" ? (
    <ShieldCheck className="w-3 h-3" />
  ) : user.role === "manager" ? (
    <Crown className="w-3 h-3" />
  ) : (
    <UserCog className="w-3 h-3" />
  );

  const roleBadgeVariant = user.role === "admin" ? "coral" as const : user.role === "manager" ? "amber" as const : "default" as const;
  const roleLabel = user.role === "admin" ? "Админ" : user.role === "manager" ? "Менеджер" : "Участник";

  return (
    <Card padding="sm" className="relative">
      <div className="flex items-center gap-3">
        <Avatar name={fullName} src={user.photo_url} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-warm-700 truncate">{fullName}</div>
          <div className="text-[10px] text-warm-400 truncate">
            {user.username ? `@${user.username}` : ""}
            {user.phone ? ` ${user.phone}` : ""}
          </div>
          <div className="text-[10px] text-warm-300">
            {new Date(user.created_at).toLocaleDateString("ru-RU")}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={changing}
            className="flex items-center gap-1"
          >
            <Badge variant={roleBadgeVariant}>
              {changing ? <Loader2 className="w-3 h-3 animate-spin" /> : roleIcon}
              <span className="ml-1">{roleLabel}</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Badge>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-warm-200/60 py-1 min-w-[140px]">
                {(["user", "manager", "admin"] as const).map((r) => {
                  const label = r === "admin" ? "Админ" : r === "manager" ? "Менеджер" : "Участник";
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setShowMenu(false);
                        if (r !== user.role) onRoleChange(user.id, r);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        r === user.role ? "bg-warm-50 text-warm-800 font-medium" : "text-warm-600 hover:bg-warm-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── Games Tab ──────────────────────────────────── */

function GamesTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!stats || stats.games.list.length === 0) {
    return (
      <Card className="text-center py-8">
        <Gamepad2 className="w-10 h-10 text-warm-200 mx-auto mb-3" />
        <p className="text-sm text-warm-400">Игр пока нет</p>
      </Card>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "Черновик",
    open: "Открыта",
    active: "Активна",
    done: "Завершена",
    archive: "Архив",
  };

  return (
    <div className="space-y-3">
      {/* Status summary */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(stats.games.byStatus).map(([status, count]) => (
          <div key={status} className="bg-warm-50 rounded-xl px-3 py-2 text-center">
            <div className="font-display font-bold text-warm-700">{count}</div>
            <div className="text-[10px] text-warm-400">{statusLabels[status] || status}</div>
          </div>
        ))}
      </div>

      {/* Game list */}
      {stats.games.list.map((g) => (
        <Card key={g.id} padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-warm-700 truncate">{g.title}</div>
              <div className="text-[10px] text-warm-400">
                {new Date(g.event_date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {g.ticket_price_rub > 0 && (
                <div className="text-[10px] text-warm-400">
                  Билет: {formatRubles(g.ticket_price_rub)}
                </div>
              )}
            </div>
            <GameStatusBadge status={g.status} />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Shared Components ─────────────────────────── */

function MetricCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-warm-400">{label}</div>
        <div className="font-display font-bold text-lg text-warm-800">{value}</div>
      </div>
    </Card>
  );
}

function RoleBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-warm-500">{label}</span>
        <span className="text-warm-700 font-medium">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GameStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "amber" | "sage" | "default" | "coral" }> = {
    draft: { label: "Черновик", variant: "default" },
    open: { label: "Открыта", variant: "amber" },
    active: { label: "LIVE", variant: "sage" },
    done: { label: "Завершена", variant: "default" },
    archive: { label: "Архив", variant: "default" },
  };
  const info = map[status] || { label: status, variant: "default" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
