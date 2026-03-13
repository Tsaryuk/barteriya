"use client";

import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { setToken } from "@/lib/api";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "barteriya_bot";

export function TelegramLoginButton({ className }: { className?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "polling" | "done">("idle");
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleLogin = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/auth/bot-token", { method: "POST" });
      const { token } = await res.json();
      setLoginToken(token);

      // Open Telegram bot with login token
      window.open(`https://t.me/${BOT_USERNAME}?start=login_${token}`, "_blank");

      setState("polling");

      // Poll for confirmation
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 60) { // 5 min timeout (60 * 5s)
          cleanup();
          setState("idle");
          return;
        }

        try {
          const checkRes = await fetch(`/api/auth/bot-token?token=${token}`);
          const data = await checkRes.json();

          if (data.status === "confirmed" && data.token) {
            cleanup();
            setState("done");
            setToken(data.token);
            localStorage.setItem("barteriya_user", JSON.stringify(data.user));
            setTimeout(() => router.push("/home"), 500);
          } else if (data.status === "expired" || data.status === "not_found") {
            cleanup();
            setState("idle");
          }
        } catch {
          // ignore polling errors
        }
      }, 3000);
    } catch (err) {
      console.error("Login error:", err);
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className={`inline-flex items-center gap-2 px-6 py-3.5 bg-green-500 text-white rounded-2xl text-sm font-medium ${className || ""}`}>
        <CheckCircle className="w-5 h-5" />
        Вход выполнен!
      </div>
    );
  }

  if (state === "polling") {
    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className || ""}`}>
        <div className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#2AABEE] text-white rounded-2xl text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin" />
          Подтверди вход в Telegram...
        </div>
        <button
          onClick={() => {
            if (loginToken) {
              window.open(`https://t.me/${BOT_USERNAME}?start=login_${loginToken}`, "_blank");
            }
          }}
          className="text-xs text-warm-400 hover:text-warm-600 underline"
        >
          Открыть бота заново
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={state === "loading"}
      className={`inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#2AABEE] text-white rounded-2xl text-sm font-medium hover:bg-[#229ED9] transition-colors disabled:opacity-50 shadow-lg shadow-[#2AABEE]/20 ${className || ""}`}
    >
      {state === "loading" ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Send className="w-5 h-5" />
      )}
      Войти через Telegram
    </button>
  );
}

export function DevLoginButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const { api } = await import("@/lib/api");
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
