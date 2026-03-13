"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, setToken, clearToken, type DBUser, type TelegramUser } from "@/lib/api";

interface AuthState {
  user: DBUser | null;
  loading: boolean;
  login: (telegramData: TelegramUser) => Promise<void>;
  loginDev: (telegramId: number, firstName: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: DBUser) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  loginDev: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    const stored = localStorage.getItem("barteriya_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (telegramData: TelegramUser) => {
    const { token, user: dbUser } = await api.loginTelegram(telegramData);
    setToken(token);
    localStorage.setItem("barteriya_user", JSON.stringify(dbUser));
    setUser(dbUser);
  }, []);

  // Dev login (for testing without Telegram)
  const loginDev = useCallback(async (telegramId: number, firstName: string) => {
    const fakeData: TelegramUser = {
      id: telegramId,
      first_name: firstName,
      auth_date: Math.floor(Date.now() / 1000),
      hash: "dev",
    };
    const { token, user: dbUser } = await api.loginTelegram(fakeData);
    setToken(token);
    localStorage.setItem("barteriya_user", JSON.stringify(dbUser));
    setUser(dbUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("barteriya_user");
    setUser(null);
  }, []);

  const updateUser = useCallback((u: DBUser) => {
    localStorage.setItem("barteriya_user", JSON.stringify(u));
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDev, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
