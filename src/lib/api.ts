const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("barteriya_token");
}

export function setToken(token: string) {
  localStorage.setItem("barteriya_token", token);
}

export function clearToken() {
  localStorage.removeItem("barteriya_token");
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// Auth
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface AuthResponse {
  token: string;
  user: DBUser;
}

export interface DBUser {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  about: string | null;
  role: "user" | "organizer" | "admin";
  tariff_id: string | null;
  tariff_expires_at: string | null;
  created_at: string;
}

export interface DBGame {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  status: "draft" | "open" | "active" | "done" | "archive";
  max_participants: number | null;
  pitch_duration_sec: number;
  organizer_id: string;
  created_at: string;
  organizer?: { id: string; first_name: string; last_name: string | null; username: string | null };
  participants?: DBParticipant[];
  pitch_session?: DBPitchSession | null;
}

export interface DBParticipant {
  id: string;
  game_id: string;
  user_id: string;
  balance_b: number;
  pitch_order: number | null;
  pitch_status: "waiting" | "active" | "done";
  joined_at: string;
  user?: { id: string; first_name: string; last_name: string | null; username: string | null; about: string | null };
}

export interface DBTransaction {
  id: string;
  game_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount_b: number;
  amount_rub: number | null;
  type: "bank_in" | "bank_out" | "transfer" | "refund";
  note: string | null;
  created_at: string;
  from_user?: { id: string; first_name: string; last_name: string | null } | null;
  to_user?: { id: string; first_name: string; last_name: string | null } | null;
}

export interface DBCertificate {
  id: string;
  transaction_id: string;
  seller_id: string;
  buyer_id: string;
  game_id: string;
  service_description: string;
  amount_b: number;
  status: "active" | "activated" | "cancelled";
  activated_at: string | null;
  created_at: string;
  seller?: { id: string; first_name: string; last_name: string | null; username: string | null };
  buyer?: { id: string; first_name: string; last_name: string | null; username: string | null };
}

export interface DBPitchSession {
  id: string;
  game_id: string;
  status: "pending" | "active" | "paused" | "done";
  current_speaker_id: string | null;
  speaker_started_at: string | null;
  updated_at: string;
  current_speaker?: DBParticipant | null;
}

export interface DBTariff {
  id: string;
  name: string;
  duration_days: number | null;
  price_rub: number;
  original_price_rub: number | null;
  is_active: boolean;
}

export interface DashboardData {
  game: DBGame;
  stats: {
    totalParticipants: number;
    totalDeals: number;
    totalBankIn: number;
    totalBankOut: number;
    totalBartersInCirculation: number;
    dealsPerMinute: number;
    avgDealSize: number;
    certsByStatus: { active: number; activated: number; cancelled: number };
  };
  participants: DBParticipant[];
  transactions: DBTransaction[];
  pitchSession: DBPitchSession | null;
  pitchQueue: DBParticipant[];
}

// API calls
export const api = {
  // Auth
  loginTelegram: (data: TelegramUser) =>
    fetchAPI<AuthResponse>("/auth/telegram", { method: "POST", body: JSON.stringify(data) }),

  // Games
  getGames: () => fetchAPI<DBGame[]>("/games"),
  getGame: (id: string) => fetchAPI<DBGame>(`/games/${id}`),
  createGame: (data: Partial<DBGame>) =>
    fetchAPI<DBGame>("/games", { method: "POST", body: JSON.stringify(data) }),
  updateGame: (id: string, data: Partial<DBGame>) =>
    fetchAPI<DBGame>(`/games/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  joinGame: (id: string) =>
    fetchAPI<DBParticipant>(`/games/${id}/join`, { method: "POST" }),

  // Bank
  deposit: (gameId: string, amountRub: number) =>
    fetchAPI<{ transaction: DBTransaction; newBalance: number }>("/bank/deposit", {
      method: "POST",
      body: JSON.stringify({ gameId, amountRub }),
    }),
  withdraw: (gameId: string, amountB: number) =>
    fetchAPI<{ transaction: DBTransaction; newBalance: number }>("/bank/withdraw", {
      method: "POST",
      body: JSON.stringify({ gameId, amountB }),
    }),

  // Transfers
  transfer: (gameId: string, toUserId: string, amountB: number, serviceDescription: string) =>
    fetchAPI<{ transaction: DBTransaction; senderBalance: number }>("/transfers", {
      method: "POST",
      body: JSON.stringify({ gameId, toUserId, amountB, serviceDescription }),
    }),
  getTransactions: (gameId: string) =>
    fetchAPI<DBTransaction[]>(`/transfers?gameId=${gameId}`),

  // Certificates
  getCertificates: (gameId?: string) =>
    fetchAPI<DBCertificate[]>(`/certificates${gameId ? `?gameId=${gameId}` : ""}`),
  activateCertificate: (id: string) =>
    fetchAPI<DBCertificate>(`/certificates/${id}/activate`, { method: "POST" }),

  // Pitch
  getPitchSession: (gameId: string) =>
    fetchAPI<{ session: DBPitchSession; queue: DBParticipant[]; pitchDurationSec: number }>(`/pitch/${gameId}`),
  startPitch: (gameId: string) =>
    fetchAPI<DBPitchSession>(`/pitch/${gameId}/start`, { method: "POST" }),
  nextPitch: (gameId: string) =>
    fetchAPI<{ status: string; speakerId?: string }>(`/pitch/${gameId}/next`, { method: "POST" }),

  // Dashboard
  getDashboard: (gameId: string) => fetchAPI<DashboardData>(`/dashboard/${gameId}`),

  // Payments
  createPayment: (tariffId: string) =>
    fetchAPI<{ paymentId: string; confirmationUrl: string }>("/payments", {
      method: "POST",
      body: JSON.stringify({ tariffId }),
    }),

  // Tariffs (via Supabase direct)
  getTariffs: async (): Promise<DBTariff[]> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tariffs?is_active=eq.true&order=price_rub`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );
    return res.json();
  },
};
