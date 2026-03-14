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

// Get user profile photo URL
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

    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
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
