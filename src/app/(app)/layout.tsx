"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth";
import { GameProvider, useGame } from "@/context/game";
import {
  Home,
  Gamepad2,
  ArrowRightLeft,
  FileCheck,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Главная" },
  { href: "/games", icon: Gamepad2, label: "Игры" },
  { href: "/transfer", icon: ArrowRightLeft, label: "Перевод" },
  { href: "/certificates", icon: FileCheck, label: "Серт." },
  { href: "/profile", icon: User, label: "Профиль" },
];

function AppHeader() {
  const { activeGame } = useGame();

  return (
    <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur-xl border-b border-warm-200/40 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-amber flex items-center justify-center">
          <ArrowRightLeft className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display font-semibold text-warm-800">Бартерия</span>
      </div>
      {activeGame && (
        <div className="flex items-center gap-2">
          {activeGame.status === "active" && <div className="live-dot" />}
          <span className="text-xs text-warm-400">{activeGame.title}</span>
        </div>
      )}
    </header>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AppHeader />

      <main className="flex-1 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-warm-200/40 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors",
                  isActive
                    ? "text-brand-amber"
                    : "text-warm-400 hover:text-warm-600"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-amber" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GameProvider>
        <AppShell>{children}</AppShell>
      </GameProvider>
    </AuthProvider>
  );
}
