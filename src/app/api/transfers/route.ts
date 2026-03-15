export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { notifyUser, escapeHtml } from "@/lib/telegram";
import { formatBarters } from "@/lib/utils";

// POST /api/transfers - transfer barters between participants
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameId, toUserId, amountB, serviceDescription } = body;

    if (!gameId || !toUserId || !amountB || amountB <= 0 || !serviceDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (toUserId === auth.userId) {
      return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get sender participant
    const { data: sender } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", auth.userId)
      .single();

    if (!sender) {
      return NextResponse.json({ error: "You are not in this game" }, { status: 403 });
    }

    if (Number(sender.balance_b) < amountB) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Get receiver participant
    const { data: receiver } = await supabase
      .from("game_participants")
      .select("id, balance_b")
      .eq("game_id", gameId)
      .eq("user_id", toUserId)
      .single();

    if (!receiver) {
      return NextResponse.json({ error: "Recipient not in this game" }, { status: 400 });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        game_id: gameId,
        from_user_id: auth.userId,
        to_user_id: toUserId,
        amount_b: amountB,
        type: "transfer",
        note: serviceDescription,
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update game balances
    await supabase
      .from("game_participants")
      .update({ balance_b: Number(sender.balance_b) - amountB })
      .eq("id", sender.id);

    await supabase
      .from("game_participants")
      .update({ balance_b: Number(receiver.balance_b) + amountB })
      .eq("id", receiver.id);

    // Sync global balances
    const { data: senderGlobal } = await supabase
      .from("users")
      .select("balance_b")
      .eq("id", auth.userId)
      .single();
    await supabase
      .from("users")
      .update({ balance_b: Math.max(0, (Number(senderGlobal?.balance_b) || 0) - amountB) })
      .eq("id", auth.userId);

    const { data: receiverGlobal } = await supabase
      .from("users")
      .select("balance_b")
      .eq("id", toUserId)
      .single();
    await supabase
      .from("users")
      .update({ balance_b: (Number(receiverGlobal?.balance_b) || 0) + amountB })
      .eq("id", toUserId);

    // Notify recipient via Telegram (fire-and-forget)
    const { data: senderUser } = await supabase
      .from("users")
      .select("first_name")
      .eq("id", auth.userId)
      .single();
    const { data: recipientUser } = await supabase
      .from("users")
      .select("telegram_id, first_name")
      .eq("id", toUserId)
      .single();

    if (recipientUser?.telegram_id) {
      const senderName = escapeHtml(senderUser?.first_name || "Кто-то");
      notifyUser(
        recipientUser.telegram_id,
        `💸 <b>Новый перевод!</b>\n\n${senderName} отправил тебе <b>${formatBarters(amountB)}</b>\n📝 ${escapeHtml(serviceDescription)}`
      ).catch(() => {});
    }

    return NextResponse.json({
      transaction,
      senderBalance: Number(sender.balance_b) - amountB,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}

// GET /api/transfers?gameId=... - list transactions for a game
export async function GET(req: NextRequest) {
  try {
    const gameId = req.nextUrl.searchParams.get("gameId");
    if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });

    const supabase = createServerClient();
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        from_user:users!from_user_id(id, first_name, last_name, username, photo_url),
        to_user:users!to_user_id(id, first_name, last_name, username, photo_url)
      `)
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Transactions list error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
