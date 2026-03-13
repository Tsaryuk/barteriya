"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api, type DBGame, type DBParticipant } from "@/lib/api";
import { useAuth } from "./auth";
import { useSupabaseSubscription } from "@/hooks/use-realtime";

interface GameState {
  activeGame: DBGame | null;
  myParticipant: DBParticipant | null;
  loading: boolean;
  setActiveGame: (game: DBGame | null) => void;
  refreshGame: (gameId: string) => Promise<void>;
}

const GameContext = createContext<GameState>({
  activeGame: null,
  myParticipant: null,
  loading: false,
  setActiveGame: () => {},
  refreshGame: async () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeGame, setActiveGameState] = useState<DBGame | null>(null);
  const [myParticipant, setMyParticipant] = useState<DBParticipant | null>(null);
  const [loading, setLoading] = useState(false);

  const setActiveGame = useCallback((game: DBGame | null) => {
    setActiveGameState(game);
    if (game && user) {
      const me = game.participants?.find((p) => p.user_id === user.id) || null;
      setMyParticipant(me);
    } else {
      setMyParticipant(null);
    }
  }, [user]);

  const refreshGame = useCallback(async (gameId: string) => {
    setLoading(true);
    try {
      const game = await api.getGame(gameId);
      setActiveGameState(game);
      if (user) {
        const me = game.participants?.find((p) => p.user_id === user.id) || null;
        setMyParticipant(me);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useSupabaseSubscription(
    `game-${activeGame?.id}`,
    [
      {
        table: "game_participants",
        event: "UPDATE",
        filter: activeGame ? `game_id=eq.${activeGame.id}` : undefined,
        callback: (payload) => {
          const updated = payload.new as unknown as DBParticipant;
          if (user && updated.user_id === user.id) {
            setMyParticipant((prev) => prev ? { ...prev, balance_b: updated.balance_b, pitch_status: updated.pitch_status } : prev);
          }
        },
      },
      {
        table: "games",
        event: "UPDATE",
        filter: activeGame ? `id=eq.${activeGame.id}` : undefined,
        callback: (payload) => {
          const updated = payload.new as unknown as DBGame;
          setActiveGameState((prev) => prev ? { ...prev, status: updated.status } : prev);
        },
      },
    ],
    !!activeGame
  );

  return (
    <GameContext.Provider value={{ activeGame, myParticipant, loading, setActiveGame, refreshGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
