import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendMessage, escapeHtml } from "@/lib/telegram";
import { formatBarters } from "@/lib/utils";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from: { id: number; first_name: string; username?: string };
    text?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();
    const msg = update.message;
    if (!msg?.text) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const text = msg.text.trim();

    if (text === "/start") {
      await handleStart(chatId, telegramId, msg.from.first_name);
    } else if (text === "/game" || text === "/games") {
      await handleGame(chatId, telegramId);
    } else if (text === "/balance" || text === "/b") {
      await handleBalance(chatId, telegramId);
    } else if (text === "/help") {
      await handleHelp(chatId);
    } else {
      await sendMessage({
        chat_id: chatId,
        text: "Неизвестная команда. Напиши /help для списка команд.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always 200 for Telegram
  }
}

async function handleStart(chatId: number, telegramId: number, firstName: string) {
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, first_name")
    .eq("telegram_id", telegramId)
    .single();

  if (user) {
    await sendMessage({
      chat_id: chatId,
      text: `Привет, ${escapeHtml(user.first_name)}! Ты уже зарегистрирован в Бартерии.\n\n/game — активная игра\n/balance — баланс\n/help — все команды`,
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: `Привет, ${escapeHtml(firstName)}! Добро пожаловать в Бартерию — клуб бартерных сделок.\n\nЧтобы начать, войди через веб-приложение с помощью Telegram Login.\n\n/help — все команды`,
    });
  }
}

async function handleGame(chatId: number, telegramId: number) {
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) {
    await sendMessage({ chat_id: chatId, text: "Сначала зарегистрируйся через /start" });
    return;
  }

  // Find active games the user participates in
  const { data: participations } = await supabase
    .from("game_participants")
    .select(`
      balance_b,
      game:games!game_id(id, title, status, event_date, location)
    `)
    .eq("user_id", user.id);

  if (!participations || participations.length === 0) {
    await sendMessage({ chat_id: chatId, text: "Ты пока не участвуешь ни в одной игре." });
    return;
  }

  const lines = participations.map((p) => {
    const g = p.game as unknown as { title: string; status: string; event_date: string; location: string | null };
    const statusMap: Record<string, string> = {
      draft: "Черновик", open: "Открыта", active: "Идёт", done: "Завершена", archive: "Архив",
    };
    const date = new Date(g.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    return `<b>${escapeHtml(g.title)}</b>\n📅 ${date}${g.location ? ` · 📍 ${escapeHtml(g.location)}` : ""}\n💰 Баланс: ${formatBarters(p.balance_b)}\n🔹 Статус: ${statusMap[g.status] || g.status}`;
  });

  await sendMessage({
    chat_id: chatId,
    text: `🎮 <b>Мои игры</b>\n\n${lines.join("\n\n")}`,
  });
}

async function handleBalance(chatId: number, telegramId: number) {
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) {
    await sendMessage({ chat_id: chatId, text: "Сначала зарегистрируйся через /start" });
    return;
  }

  const { data: participations } = await supabase
    .from("game_participants")
    .select(`
      balance_b,
      game:games!game_id(title, status)
    `)
    .eq("user_id", user.id);

  if (!participations || participations.length === 0) {
    await sendMessage({ chat_id: chatId, text: "Ты пока не участвуешь ни в одной игре." });
    return;
  }

  const activeGames = participations.filter((p) => {
    const g = p.game as unknown as { status: string };
    return g.status === "active" || g.status === "open";
  });

  if (activeGames.length === 0) {
    await sendMessage({ chat_id: chatId, text: "Нет активных игр." });
    return;
  }

  const lines = activeGames.map((p) => {
    const g = p.game as unknown as { title: string };
    return `${escapeHtml(g.title)}: <b>${formatBarters(p.balance_b)}</b>`;
  });

  await sendMessage({
    chat_id: chatId,
    text: `💰 <b>Баланс</b>\n\n${lines.join("\n")}`,
  });
}

async function handleHelp(chatId: number) {
  await sendMessage({
    chat_id: chatId,
    text: `<b>Команды Бартерия-бота</b>\n\n/start — приветствие\n/game — мои игры\n/balance — баланс\n/help — эта справка\n\nУведомления приходят автоматически при переводах и питч-сессиях.`,
  });
}
