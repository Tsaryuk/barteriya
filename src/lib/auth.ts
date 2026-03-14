import { createServerClient } from "./supabase";
import { NextRequest } from "next/server";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const JWT_SECRET = process.env.JWT_SECRET || "";

export interface TelegramLoginData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramLogin(data: TelegramLoginData): boolean {
  if (!BOT_TOKEN) return false;

  const { hash, ...rest } = data;
  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k as keyof typeof rest]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
}

export function createJWT(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 30 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): Record<string, unknown> | null {
  try {
    const [header, body, signature] = token.split(".");
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): { userId: string; telegramId: number } | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const payload = verifyJWT(token);
  if (!payload || !payload.userId) return null;
  return { userId: payload.userId as string, telegramId: payload.telegramId as number };
}

export async function getOrCreateUser(data: TelegramLoginData) {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", data.id)
    .single();

  if (existing) {
    // Update username/name/photo if changed
    const updates: Record<string, unknown> = {
      username: data.username || existing.username,
      first_name: data.first_name,
      last_name: data.last_name || existing.last_name,
    };
    if (data.photo_url) updates.photo_url = data.photo_url;
    const { data: updated } = await supabase
      .from("users")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
    return updated || { ...existing, ...updates };
  }

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      telegram_id: data.id,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      photo_url: data.photo_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  return newUser;
}
