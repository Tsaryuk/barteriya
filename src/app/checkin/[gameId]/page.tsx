"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import { Loader2, CheckCircle, AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "need_login" | "need_payment">("loading");
  const [message, setMessage] = useState("");
  const [gameName, setGameName] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("need_login");
      setMessage("Войдите в аккаунт чтобы отметиться на игре");
      return;
    }

    const doCheckin = async () => {
      try {
        const game = await api.getGame(gameId);
        setGameName(game.title);

        const myP = game.participants?.find((p) => p.user_id === user.id);
        if (!myP) {
          setStatus("error");
          setMessage("Вы не записаны на эту игру. Сначала купите участие.");
          return;
        }
        if (!myP.paid) {
          setStatus("need_payment");
          setMessage("Для check-in необходимо оплатить участие.");
          return;
        }
        if (myP.checked_in) {
          setStatus("success");
          setMessage("Вы уже отмечены. Добро пожаловать!");
          return;
        }

        await api.checkIn(gameId, user.id);
        setStatus("success");
        setMessage("Check-in пройден! Добро пожаловать в игру!");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Ошибка check-in");
      }
    };

    doCheckin();
  }, [gameId, user, authLoading]);

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center space-y-6">
        {gameName && (
          <p className="text-xs text-warm-400 font-medium uppercase tracking-wider">{gameName}</p>
        )}

        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-warm-300 animate-spin mx-auto" />
            <p className="text-sm text-warm-500">Проверяем данные...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-warm-800 mb-1">Вы в игре!</h2>
              <p className="text-sm text-warm-400">{message}</p>
            </div>
            <Button className="w-full" onClick={() => router.push(`/games/${gameId}`)}>
              Перейти к игре
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-warm-800 mb-1">Ошибка</h2>
              <p className="text-sm text-warm-400">{message}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/games/${gameId}`)}>
              К странице игры
            </Button>
          </>
        )}

        {status === "need_login" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <LogIn className="w-10 h-10 text-amber-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-warm-800 mb-1">Войдите в аккаунт</h2>
              <p className="text-sm text-warm-400">{message}</p>
            </div>
            <Button className="w-full" onClick={() => router.push(`/?redirect=/checkin/${gameId}`)}>
              Авторизоваться
            </Button>
          </>
        )}

        {status === "need_payment" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-warm-800 mb-1">Оплатите участие</h2>
              <p className="text-sm text-warm-400">{message}</p>
            </div>
            <Button className="w-full" onClick={() => router.push(`/games/${gameId}`)}>
              Перейти к оплате
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
