"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, type TelegramUser } from "@/lib/api";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";

export function TelegramLoginButton({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    win.onTelegramAuth = async (tgUser: TelegramUser) => {
      try {
        const { token, user } = await api.loginTelegram(tgUser);
        setToken(token);
        localStorage.setItem("barteriya_user", JSON.stringify(user));
        router.push("/home");
      } catch (err) {
        console.error("Telegram auth error:", err);
      }
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute(
        "data-telegram-login",
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "barteriya_bot"
      );
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "16");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      containerRef.current.appendChild(script);
    }

    return () => {
      const win = window as unknown as Record<string, unknown>;
      delete win.onTelegramAuth;
    };
  }, [router]);

  return <div ref={containerRef} className={className} />;
}

export function DevLoginButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const telegramId = Math.floor(Math.random() * 900000) + 100000;
      const names = ["Алиса", "Борис", "Вера", "Григорий", "Дарья"];
      const name = names[Math.floor(Math.random() * names.length)];

      const { token, user } = await api.loginTelegram({
        id: telegramId,
        first_name: name,
        auth_date: Math.floor(Date.now() / 1000),
        hash: "dev",
      });
      setToken(token);
      localStorage.setItem("barteriya_user", JSON.stringify(user));
      router.push("/home");
    } catch (err) {
      console.error("Dev login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDevLogin}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-5 py-3 bg-warm-200 text-warm-600 rounded-2xl text-sm font-medium hover:bg-warm-300 transition-colors disabled:opacity-50 ${className || ""}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      Dev Login (тест)
    </button>
  );
}
