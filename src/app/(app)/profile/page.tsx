"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth";
import { useGame } from "@/context/game";
import { api } from "@/lib/api";
import { formatBarters } from "@/lib/utils";
import {
  Settings,
  CreditCard,
  FileText,
  LogOut,
  Edit3,
  ChevronRight,
  Shield,
  Crown,
  Loader2,
  X,
  Check,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const { user, loading, logout, updateUser } = useAuth();
  const { myParticipant } = useGame();
  const [editing, setEditing] = useState(false);

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-warm-300 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-warm-400 mb-4">Войдите через Telegram для доступа к профилю</p>
        <Link href="/">
          <Button>Войти</Button>
        </Link>
      </div>
    );
  }

  const fullName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`;
  const balance = myParticipant?.balance_b ?? 0;

  return (
    <div className="p-4 space-y-5">
      {editing ? (
        <ProfileEditForm
          user={user}
          onSave={(updated) => {
            updateUser(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <Card className="text-center">
          <Avatar name={fullName} src={user.photo_url} size="xl" className="mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl text-warm-800">
            {fullName}
          </h2>
          {user.username && (
            <p className="text-sm text-warm-400 mb-1">@{user.username}</p>
          )}
          <Badge variant="amber" className="mb-4">
            <Crown className="w-3 h-3 mr-1" />
            {user.role === "admin" ? "Админ" : user.role === "manager" ? "Менеджер" : "Участник"}
          </Badge>
          {user.about && (
            <p className="text-sm text-warm-500 leading-relaxed mb-4">{user.about}</p>
          )}
          {user.phone && (
            <p className="text-xs text-warm-400 mb-4">{user.phone}</p>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit3 className="w-3.5 h-3.5" />
            Редактировать
          </Button>
        </Card>
      )}

      <Link href="/services">
        <Card hover className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-amber-light flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-amber" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-warm-800 text-sm">Мои предложения</div>
            <div className="text-xs text-warm-400">Сертификаты для игр</div>
          </div>
          <ChevronRight className="w-4 h-4 text-warm-300" />
        </Card>
      </Link>

      <Link href="/dashboard">
        <Card hover className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-sky-500" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-warm-800 text-sm">Дашборд организатора</div>
            <div className="text-xs text-warm-400">Управление играми</div>
          </div>
          <ChevronRight className="w-4 h-4 text-warm-300" />
        </Card>
      </Link>

      {user.tariff_id && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-amber flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Тариф</CardTitle>
              {user.tariff_expires_at && (
                <p className="text-xs text-warm-400">
                  Активен до {new Date(user.tariff_expires_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          <Link href="/tariffs">
            <Button variant="outline" size="sm">Продлить</Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-warm-200/40 shadow-card text-center">
          <div className="font-display font-bold text-2xl text-warm-800">--</div>
          <div className="text-xs text-warm-400">сделок</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-warm-200/40 shadow-card text-center">
          <div className="font-display font-bold text-2xl text-brand-amber">
            {formatBarters(balance)}
          </div>
          <div className="text-xs text-warm-400">баланс</div>
        </div>
      </div>

      <Card padding="sm" className="divide-y divide-warm-100">
        {[
          { icon: <FileText className="w-4 h-4" />, label: "Правила клуба", href: "#" },
          { icon: <Shield className="w-4 h-4" />, label: "Политика конфиденциальности", href: "#" },
          { icon: <Settings className="w-4 h-4" />, label: "Настройки", href: "#" },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="flex items-center gap-3 p-3.5 hover:bg-cream-50 rounded-xl transition-colors">
              <div className="text-warm-400">{item.icon}</div>
              <span className="text-sm text-warm-600 flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-warm-300" />
            </div>
          </Link>
        ))}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3.5 hover:bg-red-50 rounded-xl transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-brand-coral" />
          <span className="text-sm text-brand-coral">Выйти</span>
        </button>
      </Card>
    </div>
  );
}

function ProfileEditForm({
  user,
  onSave,
  onCancel,
}: {
  user: { first_name: string; last_name: string | null; about: string | null; phone: string | null };
  onSave: (updated: import("@/lib/api").DBUser) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name || "");
  const [about, setAbout] = useState(user.about || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        about: about.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onSave(updated);
    } catch (err) {
      setError("Не удалось сохранить");
      console.error("Profile save error:", err);
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-amber/40";

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-warm-800">Редактировать профиль</h2>
        <button onClick={onCancel} className="p-1.5 text-warm-400 hover:text-warm-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Имя *</label>
            <input
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-500 mb-1 block">Фамилия</label>
            <input
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 block">Телефон</label>
          <input
            className={inputClass}
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-warm-500 mb-1 block">О себе</label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Расскажите о своей деятельности..."
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-brand-coral">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Сохранить
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </Card>
  );
}
