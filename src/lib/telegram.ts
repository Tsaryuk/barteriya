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

// Escape HTML special chars for Telegram HTML mode
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
