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
  phone: string | null;
  photo_url: string | null;
  about: string | null;
  role: "user" | "manager" | "admin";
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
  ticket_price_rub: number;
  bank_open: boolean;
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
  checked_in: boolean;
  checked_in_at: string | null;
  paid: boolean;
  paid_at: string | null;
  joined_at: string;
  user?: { id: string; first_name: string; last_name: string | null; username: string | null; about: string | null; photo_url: string | null; phone: string | null };
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

// Услуга/предложение (шаблон, создаётся участником)
export interface DBService {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  price_b: number;
  original_price_rub: number | null;
  quantity: number | null; // null = безлимит
  expires_days: number;
  is_active: boolean;
  created_at: string;
  owner?: { id: string; first_name: string; last_name: string | null; username: string | null; photo_url: string | null; phone: string | null };
}

// Услуга, выставленная на конкретную игру
export interface DBGameService {
  id: string;
  game_id: string;
  service_id: string;
  quantity_remaining: number | null;
  is_active: boolean;
  service?: DBService;
}

// Купленный сертификат (экземпляр у покупателя)
export interface DBPurchasedCertificate {
  id: string;
  service_id: string;
  game_service_id: string | null;
  game_id: string;
  buyer_id: string;
  seller_id: string;
  amount_b: number;
  transaction_id: string | null;
  status: "active" | "redeemed" | "expired";
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
  service?: DBService;
  seller?: { id: string; first_name: string; last_name: string | null; username: string | null; phone: string | null; photo_url: string | null };
  buyer?: { id: string; first_name: string; last_name: string | null; username: string | null; phone: string | null; photo_url: string | null };
}

// Отзыв
export interface DBReview {
  id: string;
  purchase_id: string;
  author_id: string;
  target_id: string;
  rating: number;
  text: string | null;
  created_at: string;
  author?: { id: string; first_name: string; last_name: string | null; photo_url: string | null };
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
    certsByStatus: { active: number; redeemed: number; expired: number };
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

  // User
  updateProfile: (data: { about?: string; phone?: string }) =>
    fetchAPI<DBUser>("/user/profile", { method: "PATCH", body: JSON.stringify(data) }),

  // Games
  getGames: () => fetchAPI<DBGame[]>("/games"),
  getGame: (id: string) => fetchAPI<DBGame>(`/games/${id}`),
  createGame: (data: Partial<DBGame>) =>
    fetchAPI<DBGame>("/games", { method: "POST", body: JSON.stringify(data) }),
  updateGame: (id: string, data: Partial<DBGame>) =>
    fetchAPI<DBGame>(`/games/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  joinGame: (id: string) =>
    fetchAPI<DBParticipant>(`/games/${id}/join`, { method: "POST" }),
  checkIn: (gameId: string, userId: string) =>
    fetchAPI<DBParticipant>(`/games/${gameId}/checkin`, { method: "POST", body: JSON.stringify({ userId }) }),

  // Bank
  deposit: (gameId: string, amountRub: number, userId?: string) =>
    fetchAPI<{ transaction: DBTransaction; newBalance: number }>("/bank/deposit", {
      method: "POST",
      body: JSON.stringify({ gameId, amountRub, userId }),
    }),
  withdraw: (gameId: string, amountB: number) =>
    fetchAPI<{ transaction: DBTransaction; newBalance: number }>("/bank/withdraw", {
      method: "POST",
      body: JSON.stringify({ gameId, amountB }),
    }),

  // Services (user's offerings)
  getMyServices: () => fetchAPI<DBService[]>("/services"),
  createService: (data: { title: string; description?: string; price_b: number; original_price_rub?: number; quantity?: number; expires_days?: number }) =>
    fetchAPI<DBService>("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: string, data: Partial<DBService>) =>
    fetchAPI<DBService>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteService: (id: string) =>
    fetchAPI<{ ok: boolean }>(`/services/${id}`, { method: "DELETE" }),

  // Game services (catalog)
  getGameCatalog: (gameId: string) => fetchAPI<DBGameService[]>(`/games/${gameId}/catalog`),
  addServiceToGame: (gameId: string, serviceId: string) =>
    fetchAPI<DBGameService>(`/games/${gameId}/catalog`, { method: "POST", body: JSON.stringify({ serviceId }) }),
  removeServiceFromGame: (gameId: string, gameServiceId: string) =>
    fetchAPI<{ ok: boolean }>(`/games/${gameId}/catalog/${gameServiceId}`, { method: "DELETE" }),

  // Purchases (buy certificate via QR transfer)
  buyCertificate: (gameId: string, gameServiceId: string) =>
    fetchAPI<{ purchase: DBPurchasedCertificate; transaction: DBTransaction }>("/purchases", {
      method: "POST",
      body: JSON.stringify({ gameId, gameServiceId }),
    }),
  getMyPurchases: (gameId?: string) =>
    fetchAPI<DBPurchasedCertificate[]>(`/purchases${gameId ? `?gameId=${gameId}` : ""}`),
  getMySales: (gameId?: string) =>
    fetchAPI<DBPurchasedCertificate[]>(`/purchases/sales${gameId ? `?gameId=${gameId}` : ""}`),
  redeemCertificate: (id: string) =>
    fetchAPI<DBPurchasedCertificate>(`/purchases/${id}/redeem`, { method: "POST" }),

  // Reviews
  createReview: (purchaseId: string, rating: number, text?: string) =>
    fetchAPI<DBReview>("/reviews", { method: "POST", body: JSON.stringify({ purchaseId, rating, text }) }),
  getUserReviews: (userId: string) => fetchAPI<DBReview[]>(`/reviews?userId=${userId}`),

  // Transfers (direct barter transfer, kept for flexibility)
  transfer: (gameId: string, toUserId: string, amountB: number, serviceDescription: string) =>
    fetchAPI<{ transaction: DBTransaction; senderBalance: number }>("/transfers", {
      method: "POST",
      body: JSON.stringify({ gameId, toUserId, amountB, serviceDescription }),
    }),
  getTransactions: (gameId: string) =>
    fetchAPI<DBTransaction[]>(`/transfers?gameId=${gameId}`),

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
  payForGame: (gameId: string) =>
    fetchAPI<{ paymentId: string; confirmationUrl: string }>("/payments", {
      method: "POST",
      body: JSON.stringify({ gameId }),
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
