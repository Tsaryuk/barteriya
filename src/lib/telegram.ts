import { createServerClient } from "./supabase";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface SendMessageOpts {
  chat_id: number;
  text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: unknown;
}

export async function sendMessage(opts: SendMessageOpts): Promise<boolean> {
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parse_mode: "HTML", ...opts }),
    });
    return res.ok;
  } catch {
    console.error("Telegram sendMessage failed");
    return false;
  }
}

export async function setWebhook(url: string): Promise<boolean> {
  const res = await fetch(`${API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message"] }),
  });
  const data = await res.json();
  console.log("setWebhook result:", data);
  return data.ok;
}

export async function getWebhookInfo() {
  const res = await fetch(`${API}/getWebhookInfo`);
  return res.json();
}

// Notify a user by their telegram_id
export async function notifyUser(telegramId: number, text: string): Promise<boolean> {
  return sendMessage({ chat_id: telegramId, text });
}

// Download user profile photo from Telegram and upload to Supabase Storage
export async function getUserPhotoUrl(telegramId: number): Promise<string | null> {
  try {
    const res = await fetch(`${API}/getUserProfilePhotos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: telegramId, limit: 1 }),
    });
    const data = await res.json();
    if (!data.ok || !data.result?.photos?.length) return null;

    const fileId = data.result.photos[0][data.result.photos[0].length - 1].file_id;
    const fileRes = await fetch(`${API}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;

    const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;

    // Download the photo
    const photoRes = await fetch(telegramFileUrl);
    if (!photoRes.ok) return null;
    const photoBuffer = await photoRes.arrayBuffer();
    const ext = fileData.result.file_path.split(".").pop() || "jpg";
    const fileName = `avatars/${telegramId}.${ext}`;

    // Upload to Supabase Storage
    const supabase = createServerClient();
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, photoBuffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      return null;
    }

    const { data: publicUrl } = supabase.storage.from("photos").getPublicUrl(fileName);
    return publicUrl.publicUrl;
  } catch {
    return null;
  }
}

// Escape HTML special chars for Telegram HTML mode
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
