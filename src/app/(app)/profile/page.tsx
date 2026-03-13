"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth";
import { useGame } from "@/context/game";
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
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const { myParticipant } = useGame();

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
      <Card className="text-center">
        <Avatar name={fullName} size="xl" className="mx-auto mb-3" />
        <h2 className="font-display font-bold text-xl text-warm-800">
          {fullName}
        </h2>
        {user.username && (
          <p className="text-sm text-warm-400 mb-1">@{user.username}</p>
        )}
        <Badge variant="amber" className="mb-4">
          <Crown className="w-3 h-3 mr-1" />
          {user.role === "admin" ? "Админ" : user.role === "organizer" ? "Организатор" : "Участник"}
        </Badge>
        {user.about && (
          <p className="text-sm text-warm-500 leading-relaxed mb-4">{user.about}</p>
        )}
        <Button variant="outline" size="sm">
          <Edit3 className="w-3.5 h-3.5" />
          Редактировать
        </Button>
      </Card>

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
